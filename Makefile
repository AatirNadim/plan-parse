PNPM_VERSION ?= 12.4.2
PNPM ?= pnpm
CGO_ENABLED ?= 0
VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
LDFLAGS ?= -s -w -X main.version=$(VERSION)

.PHONY: all build build-ui test clean

all: build

build-ui:
	@echo "Building UI..."
	@if [ ! -d "ui/node_modules" ]; then \
		echo "Installing UI dependencies with $(PNPM)..."; \
		cd ui && $(PNPM) install --frozen-lockfile; \
	fi
	cd ui && $(PNPM) run build
	mkdir -p pkg/server/ui
	rm -rf pkg/server/ui/out
	cp -r ui/out pkg/server/ui/out
	find pkg/server/ui/out -name "*.md" -delete

build: build-ui
	@echo "Building plan-parse Go binary ($(VERSION))..."
	CGO_ENABLED=$(CGO_ENABLED) go build -ldflags="$(LDFLAGS)" -o plan-parse main.go

test:
	@echo "Running all tests..."
	go test -v ./...

clean:
	@echo "Cleaning build artifacts..."
	rm -f plan-parse
	rm -rf ui/out ui/.next
