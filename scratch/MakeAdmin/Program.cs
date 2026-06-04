using System;
using Npgsql;

class Program
{
    static void Main(string[] args)
    {
        var connString = "Host=localhost;Port=5432;Database=sassygurl;Username=postgres;Password=12345;";
        using var conn = new NpgsqlConnection(connString);
        conn.Open();

        if (args.Length > 0 && args[0] == "DELETE")
        {
            using var checkCmd = new NpgsqlCommand("DELETE FROM \"User\" WHERE \"email\" = 'puppeteer@test.com'", conn);
            checkCmd.ExecuteNonQuery();
            Console.WriteLine("Deleted puppeteer@test.com");
        }
        else
        {
            var hash = BCrypt.Net.BCrypt.HashPassword("P@ssw0rd123!"); 
            using var updateCmd = new NpgsqlCommand($"UPDATE \"User\" SET \"password\" = '{hash}', \"role\" = 'SUPERADMIN'::\"Role\", \"isVerified\" = true WHERE \"email\" = 'puppeteer@test.com'", conn);
            updateCmd.ExecuteNonQuery();

            using var selectCmd = new NpgsqlCommand("SELECT \"password\" FROM \"User\" WHERE \"email\" = 'puppeteer@test.com'", conn);
            using var reader = selectCmd.ExecuteReader();
            int count = 0;
            while(reader.Read()) {
                var dbHash = reader.GetString(0);
                bool isMatch = BCrypt.Net.BCrypt.Verify("P@ssw0rd123!", dbHash);
                Console.WriteLine($"Row {count} DB Hash: {dbHash}. Matches P@ssw0rd123! : {isMatch}");
                count++;
            }
            Console.WriteLine($"Total rows: {count}");
        }
    }
}
