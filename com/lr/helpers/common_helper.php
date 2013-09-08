<?php
// AWS
function aws_file($bucket, $file){
    return 'http://'.$bucket.'.s3.amazonaws.com/'.$file;
}
// SYSTEM
// http
function POST($name)
{
    return isset($_POST[$name]) ? trim($_POST[$name]) : null;
}

function section($name, $type = '')
{
    $name = trim($name, '/');
    return $type == '*' ? startsWith(CURRENT_PAGE, $name . '/') : CURRENT_PAGE == $name;
}

// strings, objects
function val($data, $name, $isNumeric = false)
{
    return isset($data[$name]) ? trim($data[$name]) : ($isNumeric ? 0 : '');
}

function startsWith($haystack, $needle)
{
    return !strncmp($haystack, $needle, strlen($needle));
}

function endsWith($haystack, $needle)
{
    $length = strlen($needle);
    return $length == 0 ? true : (substr($haystack, -$length) === $needle);
}

// user
function isUser()
{
    return $GLOBALS['user'] !== false;
}

function isAdmin()
{
    if (isset($GLOBALS['user']))
        if ($GLOBALS['user']['role'] == ROLE_ADMIN)
            return true;
    return false;
}

function userInfoSet($field, $data)
{
    $GLOBALS['user'][$field] = $data;
}

function userInfo($field = '', $set = null)
{
    if ($set !== null) {
        $GLOBALS['user'][$field] = $set;
    } else {
        if ($field == '')
            return $GLOBALS['user'];
        if (!isset($GLOBALS['user']) || !isset($GLOBALS['user'][$field]))
            return '';
        return $GLOBALS['user'][$field];
    }
}

function userLanguage()
{
    if (isset($GLOBALS['ulang']))
        return $GLOBALS['ulang'];
    else
        return DEFAULT_LANGUAGE;
}


// language
function localize($field, $return = false, $params = array())
{
    if (isset($GLOBALS['uilanguage'][$field])) {
        $field = str_replace(' - ', ' &mdash; ', $GLOBALS['uilanguage'][$field]['txt']);
        if (count($params) > 0)
            foreach ($params as $key => $val)
                $field = str_replace("%$key%", $val, $field);
    }

    if ($return)
        return $field;
    else
        echo $field;
}

// Files
$GLOBALS['addonScripts'] = array();
function includeScript($param = '')
{
    if ($param == 'js' || $param == 'css') {
        foreach ($GLOBALS['addonScripts'] as $val)
            if (endsWith($val, '.' . $param))
                file_version($val);
    } else
        $GLOBALS['addonScripts'][] = $param;
}

function file_version($file, $params = array())
{
    $imageTitle = '';

    $type = pathinfo($file, PATHINFO_EXTENSION);
    $file = ltrim($file, '/');
    $modified = filemtime(ABSOLUTE_PUBLIC_PATH . $file);

    $path = (CDN_UI != '' ? 'http://'.CDN_UI.'/' : BASE_URL) . $file . '?' . $modified;

    if (val($params, 'returnPath'))
        return $path;
    else if ($type == 'css')
        echo '<link rel="stylesheet" type="text/css" href="' . $path . '"/>';
    else if ($type == 'js')
        echo '<script type="text/javascript" src="' . $path . '"></script>';
    else if (($type == 'png' || $type == 'jpg' || $type == 'gif')) {
        if (isset($params['title'])) $imageTitle = ' title="' . $params['title'] . '"';
        echo "<img$imageTitle src=\"" . $path . '"/>';
    } else
        echo $path;
}

// Server responses
function json_response($data)
{
    echo str_replace('\/', '/', json_encode($data));
    exit;
}

function security_error($step = '')
{
    json_response(array('error' => 'SITE_SECURITY_ERROR', 'step' => $step));
}

function system_reload_required()
{
    json_response(array('system' => 'SYSTEM_RELOAD_REQUIRED'));
}

// HTML
function image_center($pathOnServer, $pathOnWeb, $justDim = false)
{
    list($width, $height, $type, $attr) = getimagesize($pathOnServer);
    if ($justDim)
        return array('l' => -round($width / 2), 't' => -round($height / 2));
    echo "<img width=\"$width\" height=\"$height\" src=\"$pathOnWeb\" style=\"margin-left:-" . round($width / 2) . 'px; margin-top:-' . round($height / 2) . 'px;left:50%;top:50%;"/>';
}

function a($link, $txt = '')
{
    echo '<a href="' . BASE_URL . $link . '">' . $txt . '</a>';
}

// User related

function avatar($params, $justReturn = false)
{
    $user = userInfo();
    $json = json_decode($user['avatar'], true);
    $hasFBaccount = strpos($user['fb_username'], ';') !== false;
    $styles = array();
    if ($json === null && $hasFBaccount) {
        $arr = explode(';', $user['fb_username']);

        if (is_numeric($params) && ($params == 50 || $params == 100))
            $dim = $params;
        else
            $dim = 2000;
        $photo = "https://graph.facebook.com/{$arr[1]}/picture?width=$dim&height=$dim";
    } else {
        if ($json === null)
            $photo = file_version('ui/img/elements/default-avatar.jpg', array('returnPath' => true));
        else if (is_numeric($params) && ($params == 50 || $params == 100 || $params == 20)) {
            $photo = awsPath(AWS_USERS_STATIC, $json['k' . $params]);
        } else {
            /*            $dims = explode('_', $json['orig']);
                        $dims = explode('.', $dims[1]);
                        $dims = explode('x', $dims[0]);
                        if (!is_array($params))
                            $params = array();
                        $params['width'] = $dims[0].'px';*/
            $photo = awsPath(AWS_USERS_STATIC, $json['orig']);
        }
    }
    if (is_array($params)) {
        foreach ($params as $key => $val)
            $styles[] = "$key:$val";
        $styles = 'style="' . implode(';', $styles) . '"';
    } else $styles = "width=\"$params\" height=\"$params\"";
    if ($justReturn)
        return $photo;
    else
        echo "<img src=\"$photo\" $styles />";
}

function name($user, $firstNameOnly = false)
{

    if ($user['first_name'] != '') {
        if ($firstNameOnly)
            echo $user['first_name'];
        else
            if ($user['last_name'] != '')
                echo $user['first_name'] . ' ' . $user['last_name'];
            else
                echo $user['username'] . ' ' . $user['last_name'];
    } else
        echo $user['username'];
}


// geo

function countryCodeByName($name)
{
    $name = trim($name);
    $counties = countries();
    foreach ($counties as $key => $val) {
        if ($val['en'] == $name || $val['ru'] == $name)
            return $key;
        echo $name;
    }

    return '';
}

function countries($code = 'all')
{
    if ($code == '')
        return '';
    include_once ABSOLUTE_PATH . 'libs/lectroom/countries.php';
    $countries = lr_get_countries();
    if ($code == 'all')
        return $countries;
    if (isset($countries[$code]))
        return $countries[$code][userLanguage()];
    return '';
}

// time, date
function timeFromDate($dateString, $divide = 1)
{
    return (strtotime($dateString) - time()) / $divide;
}

function monthByID($id, $lang = 'en')
{
    $months = en_date();
    if ($lang == 'ru') {
        return ru_date($months[$id]);
    } else
        return $months[$id];
}

function monthArray($lang = 'en')
{
    $months = en_date();
    if ($lang == 'ru') {
        foreach ($months as $key => $val) {
            $months[$key] = ru_date($val);
        }
    }
    return $months;

}