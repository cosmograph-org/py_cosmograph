@echo off

REM ------------------------------------------------------------------------------
REM (1) Check Python installation and version
REM ------------------------------------------------------------------------------
echo Checking for Python installation...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo No Python found. Downloading and installing Python 3.10...
    powershell -Command "Invoke-WebRequest -UseBasicParsing https://www.python.org/ftp/python/3.10.0/python-3.10.0-amd64.exe -OutFile python-3.10.0-amd64.exe"
    start /wait python-3.10.0-amd64.exe /quiet InstallAllUsers=1 PrependPath=1
    del python-3.10.0-amd64.exe
) else (
    for /f "tokens=2 delims= " %%i in ('python --version 2^>^&1') do set VERSION=%%i
    for /f "tokens=1,2,3 delims=." %%a in ("%VERSION%") do (
        set PYMAJOR=%%a
        set PYMINOR=%%b
        set PYPATCH=%%c
    )

    if %PYMAJOR% LSS 3 (
        echo Python version is lower than 3.10. Downloading and installing Python 3.10...
        powershell -Command "Invoke-WebRequest -UseBasicParsing https://www.python.org/ftp/python/3.10.0/python-3.10.0-amd64.exe -OutFile python-3.10.0-amd64.exe"
        start /wait python-3.10.0-amd64.exe /quiet InstallAllUsers=1 PrependPath=1
        del python-3.10.0-amd64.exe
    ) else (
        if %PYMAJOR%==3 if %PYMINOR% LSS 10 (
            echo Python version is lower than 3.10. Downloading and installing Python 3.10...
            powershell -Command "Invoke-WebRequest -UseBasicParsing https://www.python.org/ftp/python/3.10.0/python-3.10.0-amd64.exe -OutFile python-3.10.0-amd64.exe"
            start /wait python-3.10.0-amd64.exe /quiet InstallAllUsers=1 PrependPath=1
            del python-3.10.0-amd64.exe
        ) else (
            echo Python 3.10 or newer is already installed. Continuing...
        )
    )
)

REM ------------------------------------------------------------------------------
REM (2) Ensure pip is installed
REM ------------------------------------------------------------------------------
echo Checking pip installation...
pip --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Pip not found. Installing/upgrading pip...
    python -m ensurepip --upgrade
)

REM Always ensure pip is up to date
python -m pip install --upgrade pip

REM ------------------------------------------------------------------------------
REM (3) Install cosmograph
REM ------------------------------------------------------------------------------
echo Installing cosmograph...
python -m pip install cosmograph

REM ------------------------------------------------------------------------------
REM (4) Run the equivalent of: python -c "from cosmograph import cosmo"
REM ------------------------------------------------------------------------------
echo Testing cosmograph import...
python -c "from cosmograph import cosmo"

echo All steps completed.
pause
