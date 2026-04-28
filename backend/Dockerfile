<<<<<<< HEAD
FROM python:3.10-sli
=======
# Use the official Python image
FROM python:3.10-slim
>>>>>>> 05b951c13455adfb4bfcba858ac374fd4ecec629

# Set the working directory
WORKDIR /app

<<<<<<< HEAD
=======
# Copy the requirements file and install Python dependencies
>>>>>>> 05b951c13455adfb4bfcba858ac374fd4ecec629
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code (app.py, database.py, routes, etc.)
COPY . .

<<<<<<< HEAD
EXPOSE 8000

=======
# Expose the port your backend runs on (matches your docker-compose.yml)
EXPOSE 8000

# Command to run your Python app
>>>>>>> 05b951c13455adfb4bfcba858ac374fd4ecec629
CMD ["python", "app.py"]
