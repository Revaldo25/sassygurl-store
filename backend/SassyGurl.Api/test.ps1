$proc = Start-Process dotnet -ArgumentList "run" -NoNewWindow -PassThru -RedirectStandardOutput "test_logs.txt" -RedirectStandardError "test_err.txt"
Write-Host "Waiting 35 seconds for server to start..."
Start-Sleep -Seconds 35

Write-Host "Triggering test-phase5b"
Invoke-RestMethod -Uri "http://localhost:5009/api/sync/test-phase5b" -Method Get -ErrorAction SilentlyContinue | Out-Null

Write-Host "Triggering concurrent sync to test locking"
$syncUrl = "http://localhost:5009/api/sync/all"
$headers = @{ "X-Webhook-Secret" = "SASSY_ELITE_SECURE_2026" }

$job1 = Start-Job -ScriptBlock { Invoke-RestMethod -Uri $args[0] -Method Post -Headers $args[1] } -ArgumentList $syncUrl, $headers
$job2 = Start-Job -ScriptBlock { Invoke-RestMethod -Uri $args[0] -Method Post -Headers $args[1] } -ArgumentList $syncUrl, $headers

Wait-Job -Job $job1, $job2
Receive-Job -Job $job1, $job2

Write-Host "Waiting 20 seconds for scheduled sync to fire..."
Start-Sleep -Seconds 20

Stop-Process -Id $proc.Id -Force
Get-Content test_logs.txt
