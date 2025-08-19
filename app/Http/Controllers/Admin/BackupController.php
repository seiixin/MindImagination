<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Backup;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Google_Client;
use Google_Service_Drive;
use Google_Service_Drive_DriveFile;


class BackupController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'url'             => 'nullable|url',
            'frequency_days'  => 'nullable|integer|min:1',
            'type'            => 'required|in:quick,scheduled'
        ]);

        try {
            $backup = Backup::create($data);

            if ($data['type'] === 'quick') {
                $filePath = $this->runBackup();
                if (!empty($data['url'])) {
                    $this->uploadToGoogle($filePath, $data['url']);
                }
                return redirect()->back()->with('success', 'Backup completed and uploaded!');
            }

            return redirect()->back()->with('success', 'Backup schedule saved successfully!');

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Backup failed: ' . $e->getMessage());
        }
    }

    public function destroy(Backup $backup)
    {
        $backup->delete();
        return back()->with('success','Backup deleted');
    }

    // -------------------------------------------------------------------------

    protected function runBackup()
    {
        $fileName  = 'backup-' . date('Y-m-d_His') . '.sql';
        $localPath = 'backups/' . $fileName;

        $storagePath = storage_path('app/' . str_replace(['\\', '/'], DIRECTORY_SEPARATOR, $localPath));

        $dir = dirname($storagePath);
        if (!is_dir($dir)) mkdir($dir, 0777, true);

        $conn = config('database.default');
        $cfg  = config("database.connections.$conn");
        if (($cfg['driver'] ?? null) !== 'mysql') {
            return $this->runBackupPurePhp();
        }

        $host = $cfg['host'] ?? '127.0.0.1';
        $port = $cfg['port'] ?? 3306;
        $db   = $cfg['database'] ?? '';
        $user = $cfg['username'] ?? 'root';
        $pass = $cfg['password'] ?? '';

        if (!$db) throw new \Exception("Database not specified");

        $candidates = [
            'C:\\xampp\\mysql\\bin\\mysqldump.exe',
            'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
            'mysqldump'
        ];
        $bin = null;
        foreach ($candidates as $b) {
            if ($b === 'mysqldump' || file_exists($b)) { $bin = $b; break; }
        }
        if (!$bin) return $this->runBackupPurePhp();

        $base = "\"{$bin}\" --host={$host} --port={$port} --user={$user} --single-transaction --routines --triggers {$db}";
        $cmd  = ($pass === '' ? $base : $base." --password={$pass}") . " > \"{$storagePath}\" 2>&1";

        exec($cmd, $log, $code);

        if ($code !== 0 || !file_exists($storagePath) || filesize($storagePath) === 0) {
            file_put_contents($storagePath.'.err.txt', implode("\n",$log));
            return $this->runBackupPurePhp();
        }
        return $localPath;
    }

    protected function runBackupPurePhp()
    {
        $fileName  = 'fallback-' . date('Y-m-d_His') . '.sql';
        $localPath = 'backups/' . $fileName;

        $storagePath = storage_path('app/' . str_replace(['\\','/'], DIRECTORY_SEPARATOR, $localPath));
        $dir = dirname($storagePath);
        if (!is_dir($dir)) mkdir($dir, 0777, true);

        $conn = config('database.default');
        $db   = config("database.connections.$conn.database");

        $sql = "-- Fallback backup @ ".now()."\n\n";
        $tables = DB::select('SHOW TABLES');

        foreach ($tables as $tbl) {
            $table = array_values((array)$tbl)[0];
            $create = DB::select("SHOW CREATE TABLE `$table`")[0]->{'Create Table'};
            $sql .= "DROP TABLE IF EXISTS `$table`;\n$create;\n\n";

            $rows = DB::table($table)->get();
            foreach($rows as $r){
                $vals = array_map(fn($v)=> $v===null?'NULL':"'".addslashes($v)."'", (array)$r);
                $sql .= "INSERT INTO `$table` VALUES (".implode(',',$vals).");\n";
            }
            $sql .= "\n";
        }
        file_put_contents($storagePath, $sql);

        return $localPath;
    }

    protected function uploadToGoogle($localPath, $folderUrl)
    {
        preg_match('/folders\/([A-Za-z0-9_-]+)/', $folderUrl, $m);
        $folderId = $m[1] ?? null;
        if (!$folderId) throw new \Exception("Invalid Google Drive folder URL");

        $client = new Google_Client();
        $client->setClientId(env('GOOGLE_DRIVE_CLIENT_ID'));
        $client->setClientSecret(env('GOOGLE_DRIVE_CLIENT_SECRET'));
        $client->setAccessType('offline');

        $token = env('GOOGLE_DRIVE_REFRESH_TOKEN');
        if (!$token) throw new \Exception("Missing refresh token");
        $client->refreshToken($token);

        $drive = new Google_Service_Drive($client);

        $meta = new Google_Service_Drive_DriveFile();
        $meta->setParents([$folderId]);
        $meta->setName(basename($localPath));

        $content = file_get_contents(storage_path('app/' . str_replace(['\\','/'], DIRECTORY_SEPARATOR, $localPath)));

        $drive->files->create($meta,[
            'data'       => $content,
            'mimeType'   => 'application/sql',
            'uploadType' => 'multipart'
        ]);
    }
}
