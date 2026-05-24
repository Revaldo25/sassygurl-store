using System;
using Npgsql;

class Program
{
    static void Main()
    {
        string connStr = "Host=localhost;Port=5432;Database=sassygurl;Username=postgres;Password=***REDACTED_DB_PASSWORD***";
        using var conn = new NpgsqlConnection(connStr);
        conn.Open();
        using var cmd = new NpgsqlCommand("UPDATE \"Games\" SET \"IsActive\" = true WHERE \"Slug\" = 'mlbb'", conn);
        int rows = cmd.ExecuteNonQuery();
        Console.WriteLine($"Rows updated: {rows}");
    }
}
