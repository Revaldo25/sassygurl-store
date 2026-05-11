# ============================================================================
# Multi-Stage Dockerfile for SassyGurl .NET 10 API
# Optimized for minimal image size and fast builds via layer caching.
#
# Build stages:
#   1. restore  — restore NuGet packages (cached layer)
#   2. build    — compile the solution
#   3. publish  — produce trimmed, release-mode output
#   4. runtime  — minimal ASP.NET runtime image
# ============================================================================

# ── Stage 1: Restore ────────────────────────────────────────────────────────
# Separate restore step leverages Docker layer caching.
# If csproj files haven't changed, this layer is reused entirely.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS restore
WORKDIR /src

# Copy solution and project files first (cache-friendly layer)
COPY SassyGurl.slnx .
COPY SassyGurl.Domain/SassyGurl.Domain.csproj SassyGurl.Domain/
COPY SassyGurl.Application/SassyGurl.Application.csproj SassyGurl.Application/
COPY SassyGurl.Infrastructure/SassyGurl.Infrastructure.csproj SassyGurl.Infrastructure/
COPY SassyGurl.Api/SassyGurl.Api.csproj SassyGurl.Api/

RUN dotnet restore SassyGurl.slnx

# ── Stage 2: Build ──────────────────────────────────────────────────────────
FROM restore AS build
WORKDIR /src

# Copy all source code
COPY . .

RUN dotnet build SassyGurl.Api/SassyGurl.Api.csproj -c Release --no-restore

# ── Stage 3: Publish ────────────────────────────────────────────────────────
FROM build AS publish

RUN dotnet publish SassyGurl.Api/SassyGurl.Api.csproj \
    -c Release \
    --no-build \
    -o /app/publish

# ── Stage 4: Runtime ────────────────────────────────────────────────────────
# Uses the minimal ASP.NET runtime image (no SDK, smaller attack surface)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Security: run as non-root user
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser
USER appuser

# Copy published output from build stage
COPY --from=publish /app/publish .

# Health check — uses the /health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose port (Kestrel default in .NET 10)
EXPOSE 8080

# Environment variables for container configuration
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_RUNNING_IN_CONTAINER=true

ENTRYPOINT ["dotnet", "SassyGurl.Api.dll"]
