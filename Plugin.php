<?php
if (!defined('__TYPECHO_ROOT_DIR__')) exit;

/**
 * پخش کننده پیرشفته و مینیمال موسیقی برای تایپ‌چو 
 * 
 * @package SimplePlayer
 * @author پوردریایی
 * @link https://pourdaryaei.ir
 * @version 1.0
 */
class SimplePlayer_Plugin implements Typecho_Plugin_Interface
{
    public static function activate()
    {
        Typecho_Plugin::factory('Widget_Abstract_Contents')->contentEx = array('SimplePlayer_Plugin', 'parseContent');
        Typecho_Plugin::factory('Widget_Abstract_Contents')->excerptEx = array('SimplePlayer_Plugin', 'parseContent');
        Typecho_Plugin::factory('Widget_Archive')->header = array('SimplePlayer_Plugin', 'header');
        Typecho_Plugin::factory('Widget_Archive')->footer = array('SimplePlayer_Plugin', 'footer');
        return _t('پلاگین با موفقیت فعال شد');
    }

    public static function deactivate()
    {
        return _t('پلاگین با موفقیت غیرفعال شد');
    }

    public static function config(Typecho_Widget_Helper_Form $form)
    {
        $autoplay = new Typecho_Widget_Helper_Form_Element_Radio(
            'autoplay',
            array('0' => _t('خیر'), '1' => _t('بله')),
            '0',
            _t('پخش خودکار'),
            ''
        );
        $form->addInput($autoplay);

        $loop = new Typecho_Widget_Helper_Form_Element_Radio(
            'loop',
            array('0' => _t('خیر'), '1' => _t('بله')),
            '0',
            _t('حلقه (تکرار)'),
            ''
        );
        $form->addInput($loop);

        $order = new Typecho_Widget_Helper_Form_Element_Radio(
            'order',
            array('list' => _t('مرتب'), 'random' => _t('تصادفی')),
            'list',
            _t('ترتیب پخش'),
            ''
        );
        $form->addInput($order);

        $theme = new Typecho_Widget_Helper_Form_Element_Text(
            'theme',
            null,
            '#b7daff',
            _t('رنگ تم (کد hex)'),
            _t('مثلاً #b7daff')
        );
        $form->addInput($theme);
    }

    public static function personalConfig(Typecho_Widget_Helper_Form $form) {}

    public static function header()
    {
        // فایل‌های اصلی APlayer
        echo '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.css" />';
        echo '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">';
        
        // استایل سفارشی برای راست‌چین بودن سایت و جدول‌بندی لیست پخش
        echo '<style>
            .aplayer {
                direction: ltr; /* کل پلیر چپ‌چین شود */
            }
            /* بخش پخش‌کننده اصلی */
            .aplayer .aplayer-music .aplayer-title,
            .aplayer .aplayer-music .aplayer-artist {
                direction: rtl;
                text-align: right;
                display: inline-block;
            }
            .aplayer .aplayer-music .aplayer-title {
                margin-left: 8px; /* فاصله بین عنوان و هنرمند */
            }
            .aplayer .aplayer-pic {
                width: 90px;  /* افزایش عرض کاور */
                height: 90px; /* افزایش ارتفاع کاور */
            }
            .aplayer .aplayer-info {
                height: 90px; /* هماهنگی ارتفاع بخش اطلاعات با کاور */
            }
            /* لیست پخش با ساختار جدولی */
            .aplayer-list {
                direction: ltr;
            }
            .aplayer-list-item {
                display: flex;
                align-items: center;
                padding: 8px 10px;
                border-bottom: 1px solid #f0f0f0;
            }
            .aplayer-list-item .aplayer-list-index {
                width: 30px;
                color: #999;
                font-size: 12px;
                text-align: left;
            }
            .aplayer-list-item .aplayer-list-title {
                flex: 2; /* دو برابر فضای بیشتر برای عنوان */
                direction: rtl;
                text-align: right;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                padding-right: 10px;
                font-weight: 500;
            }
            .aplayer-list-item .aplayer-list-artist {
                flex: 1; /* یک برابر فضا برای هنرمند */
                direction: rtl;
                text-align: right;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                color: #666;
                font-size: 0.9em;
            }
            .aplayer-list-item .aplayer-list-artist::before {
                content: "";
                display: inline-block;
                width: 2px;
                height: 12px;
                background: #ddd;
                margin: 0 10px;
                vertical-align: middle;
            }
            .aplayer .aplayer-list ol li, .aplayer .aplayer-info .aplayer-music{
                text-align: left;
            }
            /* در موبایل برای فضاهای کوچک */
            @media (max-width: 600px) {
                .aplayer-list-item .aplayer-list-title,
                .aplayer-list-item .aplayer-list-artist {
                    white-space: normal;
                    overflow: visible;
                }
                .aplayer-list-item {
                    flex-wrap: wrap;
                }
                .aplayer-list-item .aplayer-list-index {
                    width: 25px;
                }
                .aplayer-list-item .aplayer-list-title {
                    flex: 1 0 60%;
                }
                .aplayer-list-item .aplayer-list-artist {
                    flex: 1 0 30%;
                }
                .aplayer-list-item .aplayer-list-artist::before {
                    display: none;
                }
            }
        </style>';
    }

    public static function footer()
    {
        echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.js"></script>';
    }

    public static function parseContent($content, $widget, $lastResult)
    {
        $content = empty($lastResult) ? $content : $lastResult;
        $pattern = '/\[player\](.*?)\[\/player\]/is';

        $content = preg_replace_callback($pattern, function($matches) {
            $inner = trim($matches[1]);
            if (empty($inner)) {
                return '<p style="color:red;">[player] محتوای خالی است</p>';
            }

            // تبدیل <br> به خط جدید و حذف تگ‌های اضافی
            $inner = preg_replace('/<br\s*\/?>/i', "\n", $inner);
            $inner = strip_tags($inner, '<a>');
            $lines = preg_split('/\r\n|\r|\n/', $inner);
            $songs = array();

            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '') continue;

                // استخراج آدرس‌های داخل <a>
                preg_match_all('/<a\s+[^>]*href="([^"]+)"[^>]*>/i', $line, $anchorMatches);
                $urls = $anchorMatches[1];

                // حذف تگ‌ها برای به‌دست آوردن متن ساده
                $plain = strip_tags($line);
                $parts = explode('|', $plain);
                if (count($parts) < 3) continue;

                $urlPart = trim($parts[0]);
                $title = trim($parts[1]);
                $artist = trim($parts[2]);
                $cover = isset($parts[3]) ? trim($parts[3]) : '';

                // تشخیص آدرس MP3
                if (!empty($urls)) {
                    $mp3Url = $urls[0];
                } else {
                    $mp3Url = $urlPart;
                }

                if (!preg_match('/^https?:\/\//i', $mp3Url)) continue;

                // تشخیص آدرس کاور
                if (empty($cover) && count($urls) > 1) {
                    $cover = $urls[1];
                } elseif (!empty($cover) && preg_match('/^https?:\/\//i', $cover)) {
                    // ok
                } else {
                    // استفاده از تصویر پیش‌فرض SVG که در پوشه img قرار دارد
                    $defaultCoverUrl = Helper::options()->pluginUrl . '/SimplePlayer/img/default-cover.svg';
                    $cover = $defaultCoverUrl;
                }

                $songs[] = array(
                    'name' => $title,
                    'artist' => $artist,
                    'url' => $mp3Url,
                    'cover' => $cover
                );
            }

            if (empty($songs)) {
                return '<p style="color:red;">[player] هیچ آهنگ معتبری یافت نشد</p>';
            }

            $options = Helper::options()->plugin('SimplePlayer');
            static $playerId = 0;
            $playerId++;
            $playerIdAttr = 'aplayer-' . $playerId;

            $autoplay = $options->autoplay ? 'true' : 'false';
            $loop = $options->loop ? 'all' : 'none';
            $order = $options->order == 'random' ? 'random' : 'list';
            $theme = $options->theme ?: '#b7daff';

            $audioJson = json_encode($songs, JSON_UNESCAPED_UNICODE);

            $html = '<div id="' . $playerIdAttr . '" class="aplayer" style="margin: 15px 0;"></div>';
            $html .= '<script>
                (function() {
                    function initPlayer() {
                        if (typeof APlayer !== "undefined") {
                            try {
                                new APlayer({
                                    container: document.getElementById("' . $playerIdAttr . '"),
                                    audio: ' . $audioJson . ',
                                    autoplay: ' . $autoplay . ',
                                    loop: "' . $loop . '",
                                    order: "' . $order . '",
                                    theme: "' . $theme . '",
                                    preload: "metadata",
                                    volume: 0.7,
                                    mutex: true
                                });
                            } catch (e) {
                                console.error("APlayer error:", e);
                                document.getElementById("' . $playerIdAttr . '").innerHTML = "<p style=\'color:red\'>خطا در ایجاد پخش‌کننده</p>";
                            }
                        } else {
                            setTimeout(initPlayer, 100);
                        }
                    }
                    initPlayer();
                })();
            </script>';

            return $html;
        }, $content);

        return $content;
    }
}
