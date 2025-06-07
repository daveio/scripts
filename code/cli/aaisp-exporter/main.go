package main

import (
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"resty.dev/v3"
)

//nolint:funlen
func main() {
	flag.Parse()

	// Configure slog with JSON output
	opts := &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}
	logger := slog.New(slog.NewJSONHandler(os.Stdout, opts))
	slog.SetDefault(logger)

	var (
		listenPort    = "9902"
		refreshSecs   = 60
		gaugeLabels   = []string{"LineID"}
		upstreamGauge = prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Namespace: "", Subsystem: "", ConstLabels: nil,
			Name: "upstream_sync_rate",
			Help: "Raw upstream sync rate (bits/sec)",
		}, gaugeLabels)
		downstreamGauge = prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Namespace: "", Subsystem: "", ConstLabels: nil,
			Name: "downstream_sync_rate",
			Help: "Raw downstream sync rate (bits/sec)",
		}, gaugeLabels)
		adjustedDownstreamGauge = prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Namespace: "", Subsystem: "", ConstLabels: nil,
			Name: "downstream_rate_adjusted",
			Help: "Adjusted downstream rate after optional rate limiting (bits/sec)",
		}, gaugeLabels)
		monthlyQuotaGauge = prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Namespace: "", Subsystem: "", ConstLabels: nil,
			Name: "monthly_allowance",
			Help: "Monthly quota (bytes)",
		}, gaugeLabels)
		quotaRemainingGauge = prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Namespace: "", Subsystem: "", ConstLabels: nil,
			Name: "monthly_allowance_remaining",
			Help: "Quota remaining, may exceed monthly_allowance due to rollover of unused quota (bytes)",
		}, gaugeLabels)
		gauges = AaGauges{
			QuotaMonthly:   *monthlyQuotaGauge,
			QuotaRemaining: *quotaRemainingGauge,
			RxRate:         *upstreamGauge,
			TxRate:         *downstreamGauge,
			TxRateAdjusted: *adjustedDownstreamGauge,
		}
		registry = prometheus.NewRegistry()
	)

	// Register the gauges with Prometheus's default registry.
	for _, gauge := range []prometheus.GaugeVec{
		gauges.QuotaMonthly,
		gauges.QuotaRemaining,
		gauges.RxRate,
		gauges.TxRate,
		gauges.TxRateAdjusted,
	} {
		registry.MustRegister(gauge)
	}
	// Add Go module build info.
	registry.MustRegister(collectors.NewBuildInfoCollector())

	// Update CHAOS data every 60 seconds.
	go ScheduleUpdates(gauges, refreshSecs)

	// Expose the registered metrics via HTTP.
	http.Handle("/metrics", promhttp.HandlerFor(
		registry,
		promhttp.HandlerOpts{
			ErrorLog: nil, ErrorHandling: 0, Registry: nil, DisableCompression: false, MaxRequestsInFlight: 0,
			Timeout: 0, EnableOpenMetrics: true,
		},
	))

	customPort, customPortSet := os.LookupEnv("AAISP_EXPORTER_PORT")
	if customPortSet {
		customPortInt, intParseErr := strconv.ParseInt(customPort, 10, 64)
		if (intParseErr == nil) && (customPortInt > 0) && (customPortInt < 65536) {
			listenPort = customPort
		} else {
			slog.Error("AAISP_EXPORTER_PORT is set but invalid, bailing out")
			os.Exit(1)
		}
	}

	slog.Info("starting aaisp-exporter", "port", listenPort)

	// trunk-ignore(semgrep/go.lang.security.audit.net.use-tls.use-tls): Internal service, no TLS needed.
	err := http.ListenAndServe(fmt.Sprintf(":%s", listenPort), nil)
	slog.Error("server failed", "error", err)
	os.Exit(1)
}

func ScheduleUpdates(gauges AaGauges, refreshSecs int) {
	for {
		vals, err := GetUpdatedValues()
		if err != nil {
			slog.Error("scheduled update failed")
		} else {
			if len(vals.Info) < 1 {
				slog.Error("no data returned from CHAOS API")
			} else {
				for _, lineVal := range vals.Info {
					UpdateGauge(lineVal.QuotaMonthly, lineVal.LineID, &gauges.QuotaMonthly)
					UpdateGauge(lineVal.QuotaRemaining, lineVal.LineID, &gauges.QuotaRemaining)
					UpdateGauge(lineVal.RxRate, lineVal.LineID, &gauges.RxRate)
					UpdateGauge(lineVal.TxRate, lineVal.LineID, &gauges.TxRate)
					UpdateGauge(lineVal.TxRateAdjusted, lineVal.LineID, &gauges.TxRateAdjusted)
				}
			}
		}

		time.Sleep(
			time.Duration(refreshSecs) * time.Second)
	}
}

func GetUpdatedValues() (AaResponse, error) {
	aaControlUsername, usernameSet := os.LookupEnv("AAISP_CONTROL_USERNAME")
	if !usernameSet {
		slog.Error("AAISP_CONTROL_USERNAME is not set, bailing out")
		os.Exit(1)
	} else {
		if strings.TrimSpace(aaControlUsername) == "" {
			slog.Error("AAISP_CONTROL_USERNAME is set but empty, bailing out")
			os.Exit(1)
		}
	}

	aaControlPassword, passwordSet := os.LookupEnv("AAISP_CONTROL_PASSWORD")
	if !passwordSet {
		slog.Error("AAISP_CONTROL_PASSWORD is not set, bailing out")
		os.Exit(1)
	} else {
		if strings.TrimSpace(aaControlPassword) == "" {
			slog.Error("AAISP_CONTROL_PASSWORD is set but empty, bailing out")
			os.Exit(1)
		}
	}

	httpClient := resty.New()
	resp, err := httpClient.
		R().
		SetHeader("Content-Type", "application/json").
		SetHeader("Accept", "application/json").
		SetBody(map[string]string{
			"control_login":    aaControlUsername,
			"control_password": aaControlPassword,
		}).
		SetResult(AaResponse{Info: nil}).
		Post("https://chaos2.aa.net.uk/broadband/info/json")
	if err != nil {
		if resp != nil {
			return AaResponse{}, fmt.Errorf("invalid response from API: %q", err.Error())
		}
		// else
		return AaResponse{}, fmt.Errorf("unknown failure fetching update: %q", err.Error())
	}
	// else
	return *resp.Result().(*AaResponse), nil
}

func UpdateGauge(valStr string, lineID string, gauge *prometheus.GaugeVec) {
	valFloat, err := strconv.ParseFloat(valStr, 64)
	if err == nil {
		gauge.With(prometheus.Labels{
			"LineID": lineID,
		}).Set(valFloat)
	}
}
