FROM python:3.11-slim as builder
WORKDIR /app
COPY pyproject.toml ./
RUN pip install poetry
RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /app /app
EXPOSE 8016
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8016"]
