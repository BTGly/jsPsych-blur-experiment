FROM python:3.11-slim

WORKDIR /app

COPY app/requirements.txt /app/requirements.txt
RUN pip install \
    -i https://mirrors.aliyun.com/pypi/simple \
    --trusted-host mirrors.aliyun.com \
    --no-cache-dir \
    -r /app/requirements.txt

COPY app/main.py /app/main.py

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
