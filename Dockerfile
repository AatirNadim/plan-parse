# ==============================================================================
# Stage 1: Build Frontend UI
# ==============================================================================
FROM node:22-alpine AS ui-builder

WORKDIR /app/ui

# Install dependencies first for better layer caching
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate
COPY ui/package.json ui/pnpm-lock.yaml ui/.npmrc* ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Copy UI source files and generate static export
COPY ui/ ./
RUN pnpm run build

# ==============================================================================
# Stage 2: Build Go Backend Binary
# ==============================================================================
FROM golang:1.27.1-alpine AS go-builder

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
    adduser -u 10001 -S -h /home/appuser appuser -G appgroup && \
    mkdir -p /home/appuser && chown -R appuser:appgroup /home/appuser

ENV HOME=/home/appuser

WORKDIR /app

# Copy Terraform CLI binary from official HashiCorp image
COPY --from=hashicorp/terraform:1.16.2 /bin/terraform /usr/local/bin/terraform

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

