<?php
if (!defined('__TYPECHO_ROOT_DIR__')) exit;

/**
 * SimplePlayer Media Browser Action
 * Handles AJAX requests for browsing and selecting media files
 */

// روش قدیمی تایپچو - بدون namespace
class SimplePlayer_Action extends Typecho_Widget
{
    private $_uploadDir;
    private $_uploadUrl;

    public function execute()
    {
        // Get options
        $options = Typecho_Widget::widget('Widget_Options');
        $this->_uploadDir = __TYPECHO_ROOT_DIR__ . '/usr/uploads';
        $this->_uploadUrl = $options->siteUrl . 'usr/uploads';
    }

    public function action()
    {
        // Get action type
        $do = $this->request->get('do', '');
        
        switch ($do) {
            case 'list-audio':
                $this->handleListAudio();
                break;
            case 'list-images':
                $this->handleListImages();
                break;
            case 'list':
            default:
                $this->handleList();
                break;
        }
    }

    /**
     * List all media files (audio and images)
     */
    private function handleList()
    {
        $path = $this->request->get('path', '');
        $fileType = $this->request->get('type', 'all');
        
        $result = $this->browseDirectory($path, $fileType);
        $this->sendJsonResponse($result);
    }

    /**
     * List audio files only
     */
    private function handleListAudio()
    {
        $path = $this->request->get('path', '');
        $result = $this->browseDirectory($path, 'audio');
        $this->sendJsonResponse($result);
    }

    /**
     * List image files only
     */
    private function handleListImages()
    {
        $path = $this->request->get('path', '');
        $result = $this->browseDirectory($path, 'image');
        $this->sendJsonResponse($result);
    }

    /**
     * Browse directory and return files/folders
     */
    private function browseDirectory($relativePath, $fileType = 'all')
    {
        // Security: Prevent directory traversal
        $relativePath = $this->sanitizePath($relativePath);
        
        $targetDir = $this->_uploadDir . ($relativePath ? '/' . $relativePath : '');
        
        // Create upload directory if not exists
        if (!is_dir($this->_uploadDir)) {
            @mkdir($this->_uploadDir, 0755, true);
        }
        
        // Verify path is within upload directory
        $realPath = realpath($targetDir);
        $realUploadDir = realpath($this->_uploadDir);
        
        // If directory doesn't exist yet, return empty
        if ($realPath === false) {
            return [
                'ok' => true,
                'currentPath' => $relativePath,
                'parentPath' => $this->getParentPath($relativePath),
                'folders' => [],
                'files' => []
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
                    $fileUrl = $this->_uploadUrl . '/' . $relativeFilePath;
                    
                    $fileData = [
                        'name' => $fileInfo->getBasename(),
                        'url' => $fileUrl,
                        'size' => $this->formatFileSize($fileInfo->getSize()),
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
            'parentPath' => $this->getParentPath($relativePath),
            'folders' => $folders,
            'files' => $files
        ];
    }

    /**
     * Sanitize path to prevent directory traversal attacks
     */
    private function sanitizePath($path)
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
    private function getParentPath($path)
    {
        if (empty($path)) return '';
        $parts = explode('/', $path);
        array_pop($parts);
        return implode('/', $parts);
    }

    /**
     * Format file size to human readable format
     */
    private function formatFileSize($bytes)
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
    private function sendJsonResponse($data)
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-cache, must-revalidate');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
