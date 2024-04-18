# Check if Chocolatey is installed
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    # Install Chocolatey
    Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
}

# Check if Node.js is installed using Chocolatey
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    # Install Node.js using Chocolatey
    choco install nodejs -y
}

# Check if Puppeteer is installed using npm
if (-not (Test-Path "node_modules\puppeteer")) {
    # Install Puppeteer using npm
    npm install puppeteer
}

# Start the JavaScript extractor script
Start-Process -FilePath "node" -ArgumentList "extractor.js"
