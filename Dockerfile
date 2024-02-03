FROM ubuntu
RUN apt-get update
RUN apt-get install python3-venv python3-pip -y
RUN python3 -m venv venv
RUN . venv/bin/activate
COPY . .
RUN pip install -r requirements.txt
ENTRYPOINT gunicorn -w $(nproc) -b 0.0.0.0 controller:app
