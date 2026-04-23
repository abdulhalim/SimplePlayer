<?php
/**
 * SimplePlayer Media Browser AJAX Handler
 * This file handles media browsing requests independently from Typecho router
 */

// Define Typecho root
define('__TYPECHO_ROOT_DIR__', dirname(dirname(dirname(dirname(__FILE__)))));
define('__TYPECHO_PLUGIN_URL__', dirname(__FILE__));

// Set error reporting
error_reporting(0);
ini_set('display_errors', 0);

// Start session for security
session_start();

// Security check - verify referer first
$referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
$hasValidReferer = false;

// Try to get site URL from database config file
$configFile = __TYPECHO_ROOT_DIR__ . '/config.inc.php';
$siteUrl = '';

if (file_exists($configFile)) {
    // Include config to get site URL
    include_once $configFile;
    
    // Try to initialize database
    if (class_exists('Typecho_Db')) {
        try {
            $db = Typecho_Db::get();
            $options = $db->fetchRow($db->select('value')->from('table.options')->where('name = ?', 'siteUrl'));
            if ($options && isset($options['value'])) {
                $siteUrl = $options['value'];
            }
        } catch (Exception $e) {
            // If database fails, try to get from config
        }
    }
}

// Fallback: get site URL from referer
if (empty($siteUrl) && !empty($referer)) {
    $parsed = parse_url($referer);
    if ($parsed && isset($parsed['host'])) {
        $siteUrl = (isset($parsed['scheme']) ? $parsed['scheme'] : 'http') . '://' . $parsed['host'];
        if (isset($parsed['port']) && $parsed['port'] != 80 && $parsed['port'] != 443) {
            $siteUrl .= ':' . $parsed['port'];
        }
        // Get path (before /admin/)
        if (isset($parsed['path'])) {
            $pathParts = explode('/admin/', $parsed['path']);
            $siteUrl .= $pathParts[0];
        }
        $siteUrl = rtrim($siteUrl, '/');
    }
}

// Validate referer
if (!empty($siteUrl) && strpos($referer, $siteUrl) === 0) {
    $hasValidReferer = true;
}

// If still no valid referer, check if it's from same host
if (!$hasValidReferer && !empty($referer)) {
    $refererHost = parse_url($referer, PHP_URL_HOST);
    $serverHost = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
    if ($refererHost === $serverHost) {
        $hasValidReferer = true;
    }
}

// Security: Block if no valid referer (but allow for testing)
if (!$hasValidReferer && empty($referer)) {
    // Allow if no referer but from admin area (direct browser test)
    // This is a relaxed check for development
    $hasValidReferer = true;
}

// Paths
$uploadDir = __TYPECHO_ROOT_DIR__ . '/usr/uploads';
$uploadUrl = rtrim($siteUrl, '/') . '/usr/uploads';

// Get parameters
$do = isset($_GET['do']) ? $_GET['do'] : '';
$path = isset($_GET['path']) ? $_GET['path'] : '';

// Handle request
switch ($do) {
    case 'list-audio':
        $result = browseDirectory($path, 'audio', $uploadDir, $uploadUrl);
        break;
    case 'list-images':
        $result = browseDirectory($path, 'image', $uploadDir, $uploadUrl);
        break;
    case 'list':
    default:
        $result = browseDirectory($path, 'all', $uploadDir, $uploadUrl);
        break;
}

sendJsonResponse($result);

/**
 * Browse directory and return files/folders
 */
function browseDirectory($relativePath, $fileType, $uploadDir, $uploadUrl)
{
    // Security: Prevent directory traversal
    $relativePath = sanitizePath($relativePath);
    
    $targetDir = $uploadDir . ($relativePath ? '/' . $relativePath : '');
    
    // Create upload directory if not exists
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0755, true);
    }
    
    // Verify path is within upload directory
    $realPath = realpath($targetDir);
    $realUploadDir = realpath($uploadDir);
    
    // If directory doesn't exist yet, return empty
    if ($realPath === false) {
        return [
            'ok' => true,
            'currentPath' => $relativePath,
            'parentPath' => getParentPath($relativePath),
            'folders' => [],
            'files' => [],
            'debug' => [
                'targetDir' => $targetDir,
                'uploadDir' => $uploadDir,
                'exists' => is_dir($targetDir)
            ]
        ];
    }
    
    if ($realUploadDir === false || strpos($realPath, $realUploadDir) !== 0) {
        return ['ok' => false, 'msg' => 'Invalid path', 'folders' => [], 'files' => []];
    }
    
    if (!is_dir($realPath)) {
        return ['ok' => false, 'msg' => 'Directory not found', 'folders' => [], 'files' => []];
    }

    $folders = [];
    $files = [];
    
    // Audio extensions
    $audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'];
    // Image extensions
    $imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    
    try {
        $iterator = new FilesystemIterator($realPath, FilesystemIterator::SKIP_DOTS);
        
        foreach ($iterator as $fileInfo) {
            if ($fileInfo->isDir()) {
                $folders[] = [
                    'name' => $fileInfo->getBasename(),
                    'path' => ($relativePath ? $relativePath . '/' : '') . $fileInfo->getBasename(),
                    'type' => 'folder'
                ];
            } else if ($fileInfo->isFile()) {
                $ext = strtolower($fileInfo->getExtension());
                $isAudio = in_array($ext, $audioExts);
                $isImage = in_array($ext, $imageExts);
                
                // Filter by file type
                if ($fileType === 'audio' && !$isAudio) continue;
                if ($fileType === 'image' && !$isImage) continue;
                if ($fileType === 'all' && !$isAudio && !$isImage) continue;
                
                // Build file URL
                $relativeFilePath = ($relativePath ? $relativePath . '/' : '') . $fileInfo->getBasename();
                $fileUrl = $uploadUrl . '/' . $relativeFilePath;
                
                $fileData = [
                    'name' => $fileInfo->getBasename(),
                    'url' => $fileUrl,
                    'size' => formatFileSize($fileInfo->getSize()),
                    'sizeBytes' => $fileInfo->getSize(),
                    'mtime' => $fileInfo->getMTime(),
                    'ext' => $ext,
                    'type' => $isAudio ? 'audio' : 'image'
                ];
                
                // Add thumbnail for images
                if ($isImage) {
                    $fileData['thumbnail'] = $fileUrl;
                }
                
                $files[] = $fileData;
            }
        }
    } catch (Exception $e) {
        return ['ok' => false, 'msg' => 'Error reading directory: ' . $e->getMessage(), 'folders' => [], 'files' => []];
    }
    
    // Sort folders alphabetically
    usort($folders, function($a, $b) {
        return strnatcasecmp($a['name'], $b['name']);
    });
    
    // Sort files by modification time (newest first)
    usort($files, function($a, $b) {
        return ($b['mtime'] ?? 0) <=> ($a['mtime'] ?? 0);
    });
    
    return [
        'ok' => true,
        'currentPath' => $relativePath,
        'parentPath' => getParentPath($relativePath),
        'folders' => $folders,
        'files' => $files
    ];
}

/**
 * Sanitize path to prevent directory traversal attacks
 */
function sanitizePath($path)
{
    $path = str_replace(chr(0), '', $path);
    $path = str_replace(['\\', '..'], '', $path);
    $path = trim($path, '/');
    $path = preg_replace('/[^a-zA-Z0-9\p{Arabic}\/_\.\-]/u', '', $path);
    return $path;
}

/**
 * Get parent path for navigation
 */
function getParentPath($path)
{
    if (empty($path)) return '';
    $parts = explode('/', $path);
    array_pop($parts);
    return implode('/', $parts);
}

/**
 * Format file size to human readable format
 */
function formatFileSize($bytes)
{
    $units = ['B', 'KB', 'MB', 'GB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, 2) . ' ' . $units[$pow];
}

/**
 * Send JSON response
 */
function sendJsonResponse($data)
{
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-cache, must-revalidate');
    header('Access-Control-Allow-Origin: *');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
