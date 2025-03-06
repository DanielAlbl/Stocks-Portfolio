FROM ubuntu
RUN apt-get update
RUN apt-get install python3-venv python3-pip -y
RUN python3 -m venv venv
COPY . .
RUN venv/bin/pip install -r requirements.txt
ENTRYPOINT venv/bin/gunicorn -w $(nproc) -b 0.0.0.0 controller:app
