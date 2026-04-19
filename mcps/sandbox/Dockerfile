FROM python:3.11-slim

RUN pip install --no-cache-dir \
    pandas \
    numpy \
    scipy \
    statsmodels \
    scikit-learn \
    aif360 \
    fairlearn \
    shap \
    matplotlib \
    seaborn \
    joblib

RUN mkdir -p /workspace/outputs

WORKDIR /workspace
