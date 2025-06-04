FROM golang:1.24.3-alpine3.21
HEALTHCHECK CMD "aaisp-exporter"
RUN adduser -h /go/src/app -D aaisp && \
    chown -R aaisp /go
USER aaisp
WORKDIR /go/src/app
COPY . /go/src/app
RUN go get -d -v ./... && \
    go build -o /go/bin/aaisp-exporter
ENTRYPOINT ["/go/bin/aaisp-exporter"]
EXPOSE 9902/tcp
