using System;
using Npgsql;

var connString = Environment.GetEnvironmentVariable("DATABASE_URL") 
    ?? "Host=localhost;Port=5432;Database=sassygurl;Username=postgres;Password=[SET_VIA_ENV];Maximum Pool Size=20;Include Error Detail=True";
using var conn = new NpgsqlConnection(connString);
conn.Open();

var sql = "UPDATE \"SystemSetting\" SET value = '{\"IsActive\":false,\"ForceTrigger\":false,\"GameIds\":[]}' WHERE key = 'FlashSaleConfig'";
using var cmd = new NpgsqlCommand(sql, conn);
int rows = cmd.ExecuteNonQuery();
Console.WriteLine($"Updated {rows} rows");
