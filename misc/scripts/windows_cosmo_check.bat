@echo off

: Tip: To run this script on a virgin windows server (e.g. terminator.aeza.net/), where you don't have copy/paste abilities, you can do the following
: (check that the bit.ly url still points here, to https://raw.githubusercontent.com/cosmograph-org/py_cosmograph/refs/heads/main/misc/scripts/windows_cosmo_check.bat)
: curl -L -o check_cosmo.bat https://bit.ly/3Pvu3ii
: check_cosmo.bat


REM ------------------------------------------------------------------------------
REM Step 1: Always install Python 3.10
REM ------------------------------------------------------------------------------
echo Downloading Python 3.10...
powershell -Command "Invoke-WebRequest -UseBasicParsing https://www.python.org/ftp/python/3.12.8/python-3.12.8.exe -OutFile python-3.10.0-amd64.exe"
echo Installing Python 3.10...
start /wait python-3.10.0-amd64.exe InstallAllUsers=1 PrependPath=1
del python-3.10.0-amd64.exe

REM ------------------------------------------------------------------------------
REM Step 2: Ensure pip is installed and upgraded
REM ------------------------------------------------------------------------------
echo Ensuring pip is installed and up to date...
py -m ensurepip --upgrade
py -m pip install --upgrade pip

REM ------------------------------------------------------------------------------
REM Step 3: Install cosmograph
REM ------------------------------------------------------------------------------
echo Installing cosmograph...
py -m pip install cosmograph

REM ------------------------------------------------------------------------------
REM Step 4: Test importing cosmograph
REM ------------------------------------------------------------------------------
echo Testing cosmograph import...
py -c "from cosmograph import cosmo"

echo All steps completed.
pause
