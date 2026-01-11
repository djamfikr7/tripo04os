FROM golang:1.21-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates

RUN go mod download

COPY . .
RUN go build -o safety-service ./cmd/

FROM alpine:latest AS runner

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

RUN addgroup -g 1001 -S

RUN adduser -u 1001 -D tripo04os

COPY --from=builder /app/safety-service .
COPY --from=builder /app/go.sum .

RUN chown -R tripo04os:1001 /app

USER tripo04os

EXPOSE 8009

ENV GIN_MODE=release
ENV PORT=8009

CMD ["./safety-service"]
