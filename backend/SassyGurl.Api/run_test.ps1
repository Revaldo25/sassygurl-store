 = Start-Process dotnet -ArgumentList "run" -NoNewWindow -PassThru -RedirectStandardOutput "test_logs.txt" -RedirectStandardError "test_err.txt"
Start-Sleep -Seconds 10
Write-Host "Triggering test-phase5b"
Invoke-RestMethod -Uri "http://localhost:5009/api/sync/test-phase5b" -Method Get
Write-Host "Triggering concurrent sync to test locking"
 = "http://localhost:5009/api/sync/all"
 = @{ "X-Webhook-Secret" = "SASSY_ELITE_SECURE_2026" }
 = [System.Threading.Tasks.Task]::Run({ try { Invoke-RestMethod -Uri  -Method Post -Headers  } catch {} })
 = [System.Threading.Tasks.Task]::Run({ try { Invoke-RestMethod -Uri  -Method Post -Headers  } catch {} })
[System.Threading.Tasks.Task]::WaitAll(, )
Start-Sleep -Seconds 10
Stop-Process -Id $proc.Id -Force
Get-Content test_logs.txt
