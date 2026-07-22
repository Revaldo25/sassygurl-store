using System;
using Npgsql;

var connString = "Host=localhost;Port=5432;Database=sassygurl;Username=postgres;Password=***REDACTED_DB_PASSWORD***;Maximum Pool Size=20;Include Error Detail=True";
using var conn = new NpgsqlConnection(connString);
conn.Open();

var sql = "UPDATE \"SystemSetting\" SET value = '{\"IsActive\":false,\"ForceTrigger\":false,\"GameIds\":[]}' WHERE key = 'FlashSaleConfig'";
using var cmd = new NpgsqlCommand(sql, conn);
int rows = cmd.ExecuteNonQuery();
Console.WriteLine($"Updated {rows} rows");
