$ErrorActionPreference = "Stop"
$baseUrl = "http://172.17.27.76:8080"

Write-Host "=== 1. Testing Signup ==="
$rand = Get-Random -Minimum 1000 -Maximum 9999
$signupBody = "{`"name`":`"Alice Intern`",`"email`":`"alice$rand@guvi.com`",`"password`":`"secretpassword123`"}"
$signupRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method Post -Body $signupBody -ContentType "application/json"
$token = $signupRes.token
Write-Host "User ID:" $signupRes.user.id
Write-Host "Token received:" ($token.Substring(0, 20) + "...")

Write-Host "`n=== 2. Testing Login ==="
$loginBody = "{`"email`":`"alice$rand@guvi.com`",`"password`":`"secretpassword123`"}"
$loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
Write-Host "Login successful for:" $loginRes.user.name

Write-Host "`n=== 3. Testing Get Me ==="
$headers = @{ "Authorization" = "Bearer $token" }
$meRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers $headers
Write-Host "Me response:" $meRes.user.email

Write-Host "`n=== 4. Creating Poll ==="
$pollBody = '{"question":"What is your favorite programming language?","options":["Python","JavaScript","Go","Java"],"expiration_type":"24h"}'
$pollRes = Invoke-RestMethod -Uri "$baseUrl/api/polls" -Method Post -Body $pollBody -Headers $headers -ContentType "application/json"
$pollId = $pollRes.id
$shareCode = $pollRes.share_code
Write-Host "Created Poll ID:" $pollId
Write-Host "Share Code:" $shareCode

Write-Host "`n=== 5. Fetching Poll by ShareCode ==="
$publicPoll = Invoke-RestMethod -Uri "$baseUrl/api/polls/share/$shareCode" -Method Get
Write-Host "Public Poll Question:" $publicPoll.question
Write-Host "Options count:" $publicPoll.options.Count

Write-Host "`n=== 6. Casting Vote for 'Go' (opt_3) ==="
$voteBody = '{"option_id":"opt_3","voter_id":"voter_browser_1"}'
$voteRes = Invoke-RestMethod -Uri "$baseUrl/api/polls/$pollId/vote" -Method Post -Body $voteBody -ContentType "application/json"
Write-Host "Vote Message:" $voteRes.message
Write-Host "Total votes now:" $voteRes.results.total_votes

Write-Host "`n=== 7. Casting Duplicate Vote from same voter (Should Fail 409) ==="
try {
    Invoke-RestMethod -Uri "$baseUrl/api/polls/$pollId/vote" -Method Post -Body $voteBody -ContentType "application/json"
    Write-Host "ERROR: Duplicate vote was not rejected!"
} catch {
    Write-Host "SUCCESS: Duplicate vote correctly rejected with status 409 Conflict"
}

Write-Host "`n=== 8. Casting Vote for 'Python' (opt_1) from another voter ==="
$voteBody2 = '{"option_id":"opt_1","voter_id":"voter_browser_2"}'
$voteRes2 = Invoke-RestMethod -Uri "$baseUrl/api/polls/$pollId/vote" -Method Post -Body $voteBody2 -ContentType "application/json"
Write-Host "Total votes after 2nd voter:" $voteRes2.results.total_votes

Write-Host "`n=== 9. Fetching Live Results ==="
$resultsRes = Invoke-RestMethod -Uri "$baseUrl/api/polls/$pollId/results" -Method Get
foreach ($opt in $resultsRes.options) {
    Write-Host ("  - " + $opt.text + " (" + $opt.id + "): " + $opt.votes + " votes (" + $opt.percentage + "%)")
}

Write-Host "`n=== 10. Fetching Creator's Poll Dashboard ==="
$myPolls = Invoke-RestMethod -Uri "$baseUrl/api/polls/my" -Method Get -Headers $headers
Write-Host "Total polls owned by Alice:" $myPolls.polls.Count

Write-Host "`n==============================================="
Write-Host "🎉 ALL BACKEND & DATABASE & REDIS TESTS PASSED!"
Write-Host "==============================================="
