@echo off
setlocal

:: Check if Python is installed and retrieve its version
for /f "delims=" %%P in ('where python 2^>nul') do set PYTHON_PATH=%%P
if "%PYTHON_PATH%"=="" (
    echo Python is not installed. Installing Python 3.10...
    :: Download and install Python 3.10 (64-bit)
    curl -O https://www.python.org/ftp/python/3.10.0/python-3.10.0-amd64.exe
    start /wait python-3.10.0-amd64.exe /quiet InstallAllUsers=1 PrependPath=1
    del python-3.10.0-amd64.exe
) else (
    for /f "delims=." %%V in ('python --version 2^>^&1') do set MAJOR_VERSION=%%V
    for /f "delims=. tokens=2" %%V in ('python --version 2^>^&1') do set MINOR_VERSION=%%V
    if %MAJOR_VERSION% LSS 3 (
        echo Detected Python version less than 3. Installing Python 3.10...
        curl -O https://www.python.org/ftp/python/3.10.0/python-3.10.0-amd64.exe
        start /wait python-3.10.0-amd64.exe /quiet InstallAllUsers=1 PrependPath=1
        del python-3.10.0-amd64.exe
    ) else if %MAJOR_VERSION%==3 if %MINOR_VERSION% LSS 10 (
        echo Detected Python version less than 3.10. Installing Python 3.10...
        curl -O https://www.python.org/ftp/python/3.10.0/python-3.10.0-amd64.exe
        start /wait python-3.10.0-amd64.exe /quiet InstallAllUsers=1 PrependPath=1
        del python-3.10.0-amd64.exe
    ) else (
        echo Python version is sufficient.
    )
)

:: Check if pip is installed
python -m pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Pip is not installed. Installing pip...
    python -m ensurepip --upgrade
)

:: Install the cosmograph package
echo Installing cosmograph package...
python -m pip install cosmograph --quiet

:: Run the Python command
echo Running "from cosmograph import cosmo"...
python -c "from cosmograph import cosmo"

echo Script completed.
pause
