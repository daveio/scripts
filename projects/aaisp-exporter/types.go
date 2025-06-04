package main

import "github.com/prometheus/client_golang/prometheus"

type AaResponse struct {
	Info []AaLineData `json:"info"`
}

type AaLineData struct {
	LineID         string `json:"id"`
	QuotaMonthly   string `json:"quota_monthly"`
	QuotaRemaining string `json:"quota_remaining"`
	RxRate         string `json:"rx_rate"`
	TxRate         string `json:"tx_rate"`
	TxRateAdjusted string `json:"tx_rate_adjusted"`
}

type AaGauges struct {
	QuotaMonthly   prometheus.GaugeVec
	QuotaRemaining prometheus.GaugeVec
	RxRate         prometheus.GaugeVec
	TxRate         prometheus.GaugeVec
	TxRateAdjusted prometheus.GaugeVec
}
