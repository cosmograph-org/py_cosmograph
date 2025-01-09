@echo off

:v2

REM ------------------------------------------------------------------------------
REM (1) Check Python installation and version using sys.version_info
REM ------------------------------------------------------------------------------
echo Checking for Python installation...
python -c "import sys" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo No Python found. Installing Python 3.10...
    goto :InstallPython
) else (
    REM Retrieve Python major and minor versions:
    for /f "tokens=1,2,3" %%a in ('python -c "import sys; print(sys.version_info.major, sys.version_info.minor, sys.version_info.micro)"') do (
        set PYMAJOR=%%a
        set PYMINOR=%%b
        set PYPATCH=%%c
    )

    if %PYMAJOR% LSS 3 (
        echo Python version is less than 3.10. Installing Python 3.10...
        goto :InstallPython
    ) else (
        if %PYMAJOR%==3 if %PYMINOR% LSS 10 (
            echo Python version is less than 3.10. Installing Python 3.10...
            goto :InstallPython
        ) else (
            echo Python 3.10 or newer is already installed. Proceeding...
            goto :CheckPip
        )
    )
)

:InstallPython
echo Downloading and installing Python 3.10...
powershell -Command "Invoke-WebRequest -UseBasicParsing https://www.python.org/ftp/python/3.10.0/python-3.10.0-amd64.exe -OutFile python-3.10.0-amd64.exe"
start /wait python-3.10.0-amd64.exe /quiet InstallAllUsers=1 PrependPath=1
del python-3.10.0-amd64.exe

:CheckPip
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
