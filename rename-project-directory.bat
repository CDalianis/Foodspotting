@echo off
setlocal

set "OLD_DIR=C:\Users\Christos\IdeaProjects\Cfprojectfoodspots"
set "NEW_DIR=C:\Users\Christos\IdeaProjects\projectfoodspots"

if not exist "%OLD_DIR%" (
    if exist "%NEW_DIR%" (
        echo Project directory is already renamed to projectfoodspots.
        exit /b 0
    )
    echo Old project directory not found: %OLD_DIR%
    exit /b 1
)

if exist "%NEW_DIR%" (
    echo Target directory already exists: %NEW_DIR%
    exit /b 1
)

echo Renaming project folder...
move "%OLD_DIR%" "%NEW_DIR%"
if errorlevel 1 (
    echo.
    echo Rename failed. Close Cursor/IntelliJ and any terminals using the project, then run this script again.
    exit /b 1
)

echo.
echo Done. Reopen the project from:
echo %NEW_DIR%

endlocal
