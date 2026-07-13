FROM rust:1-bookworm AS builder
WORKDIR /app
COPY services/api/Cargo.toml ./Cargo.toml
COPY services/api/Cargo.lock ./Cargo.lock
COPY services/api/src ./src
RUN cargo build --release

FROM builder AS test
RUN cargo test --locked

FROM debian:bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=test /app/target/release/crownfi-api /usr/local/bin/crownfi-api
EXPOSE 8080
CMD ["crownfi-api"]
