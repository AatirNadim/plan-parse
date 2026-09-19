# ==============================================================================
# Stage 1: Build Frontend UI
# ==============================================================================
FROM node:20-alpine AS ui-builder

WORKDIR /app/ui

# Install dependencies first for better layer caching
COPY ui/package.json ui/package-lock.json ./
RUN npm ci

# Copy UI source files and generate static export
COPY ui/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Build Go Backend Binary
# ==============================================================================
FROM golang:1.23-alpine AS go-builder

WORKDIR /app

# Download Go modules first for caching
COPY go.mod go.sum ./
RUN go mod download

# Copy backend source files
COPY main.go ./
COPY pkg/ ./pkg/

# Copy static frontend export from ui-builder stage
# Satisfies //go:embed all:ui/out directive in pkg/server/server.go
COPY --from=ui-builder /app/ui/out ./pkg/server/ui/out

# Compile static Go binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/plan-parse main.go

# ==============================================================================
# Stage 3: Minimal Production Runtime
# ==============================================================================
FROM alpine:3.20

# Install runtime dependencies for TLS and timezone support
RUN apk --no-cache add ca-certificates tzdata

# Create dedicated non-root user and group
RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

WORKDIR /app

# Copy compiled binary from go-builder stage
COPY --from=go-builder --chown=appuser:appgroup /app/plan-parse /app/plan-parse

# Run container as non-root user
USER appuser:appgroup

# Expose default HTTP server port
EXPOSE 9000

# Entrypoint runs the compiled Go server binary
ENTRYPOINT ["/app/plan-parse"]

# Default server arguments:
# - Listen on 0.0.0.0 to accept traffic from outside the container
# - Default port 9000
# - Disable automated browser launch in container environment
CMD ["-addr", "0.0.0.0", "-port", "9000", "-no-browser"]

