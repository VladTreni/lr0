<?php

namespace com\lr;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\DB;

// SYSTEM
define('ENVIRONMENT_DEVELOPMENT', 'development');
define('ENVIRONMENT_PRODUCTION', 'production');
// MEMCACHED
define('MEMCACHED_NS_DB', 'MEMCACHED_NS_DB::');
define('MEMCACHED_NS_QUERY', 'MEMCACHED_NS_QUERY::');
define('MEMCACHED_NS_ROW', 'MEMCACHED_NS_ROW::');
define('MEMCACHED_NS_ID_BY_VAL', 'MEMCACHED_NS_ID_BY_VAL::');

// STARTUP SETTINGS
define('ABSOLUTE_PATH', realpath(__DIR__ . '/../../') . '/');
define('ABSOLUTE_PUBLIC_PATH', ABSOLUTE_PATH . 'public/');

define('BASE_DOMAIN', $_SERVER['HTTP_HOST']);
define('BASE_URL', 'http' . ((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on') ? 's' : '')
    . '://' . $_SERVER['HTTP_HOST'] . str_replace('//', '/', dirname($_SERVER['SCRIPT_NAME']) . '/'));

$curURI = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
if (substr_count($curURI, '/') > 1) {
    $curURI = explode('/', $curURI);
    $curURI = $curURI[0] . '/' . $curURI[1];
}

define('CURRENT_PAGE', $curURI);

require __DIR__ . '/../../lr_config.php';
require __DIR__ . '/../../project_config.php';
require __DIR__ . '/helpers/common_helper.php';


class LR
{

    // Build site
    function __construct()
    {
    }

    // START APP
    static public function init()
    {

    }

    // SQL select
    static public function sqlSelect($db, $time = '+12 hour')
    {
        $queryID = MEMCACHED_NS_QUERY . $db->generateCacheKey();
        $query = Cache::get($queryID);
        if ($query !== null) {
            $dbTime = Cache::get(MEMCACHED_NS_DB . $db->from);
            if ($dbTime === null)
                LR::sqlInvalidateTable($db->from);
            else if ($query['date'] >= $dbTime)
                return $query['data'];
        }
        $query = $db->get();
        if ($time !== 0)
            Cache::put($queryID, array('date' => microtime(true), 'data' => $query), timeFromDate($time, 60));
        return $query;
    }

    static public function sqlFirst($db, $time = '+12 hour')
    {
        $db->take(1);
        $results = LR::sqlSelect($db, $time);
        return count($results) == 0 ? array() : reset($results);
    }

    static public function sqlRowsByVal($tableName, $field, $value, $time = '+12 hour')
    {
        $db = DB::table($tableName);
        $db->where($field, $value);
        return LR::sqlSelect($db, $time);
    }

    static public function sqlRow($tableName, $field, $value, $time = '+12 hour')
    {
        if (trim($value) == '')
            return array();
        if ($field != 'id')
            $value = LR::sqlRowIdByValue($tableName, $field, $value);
        if ($value === 0)
            return array();

        $rowID = MEMCACHED_NS_ROW . $tableName . '::' . 'id' . '::' . $value;
        $row = Cache::get($rowID);
        if ($row === null) {
            $row = DB::table($tableName);
            $row->where('id', $value);
            $row = LR::sqlFirst($row);
            if (count($row) > 0)
                Cache::put($rowID, $row, timeFromDate($time, 60));
        }
        return $row;
    }

    static public function sqlRowIdByValue($tableName, $field, $value, $dontCheckId = true, $time = '+12 hour')
    {
        $valueID = MEMCACHED_NS_ID_BY_VAL . $tableName . '::' . $field . '::' . $value;
        $id = Cache::get($valueID);
        if ($id === null) {
            $db = DB::table($tableName);
            $db->select('id');
            $db->where($field, $value);
            $db = LR::sqlFirst($db);
            if (count($db) == 0)
                return 0;
            else {
                Cache::put($valueID, $db['id'], timeFromDate($time, 60));
                return $db['id'];
            }
        } else
            return $id;

    }

    static public function sqlCount($tableName, $field, $operator = null, $value = null)
    {
        $db = DB::table($tableName);
        $db->select(DB::raw('count(*) as cnt'))->where($field, $operator, $value);
        $query = LR::sqlSelect($db);
        return $query[0]['cnt'];
    }

    // SQL update insert
    static public function sqlInsert($tableName, $insertData, $returnID = false)
    {
        if ($returnID)
            $returnID = DB::table($tableName)->insertGetId($insertData);
        else
            DB::table($tableName)->insert($insertData);
        LR::sqlInvalidateTable($tableName);
        return $returnID;
    }

    static public function sqlUpdate($table, $field, $value = null, $updateData = null, $invalidateRow = true)
    {
        // null don't invalidate
        if (is_string($table)) {
            if (DB::table($table)->where($field, $value)->update($updateData)) {
                if ($invalidateRow !== null){
                    if ($invalidateRow)
                        LR::sqlInvalidateRow($table, $field, $value);
                    else
                        LR::sqlInvalidateTable($table);
                }
            }
        } else {
            if ($table->update($field))
                LR::sqlInvalidateTable($table->from);
        }
    }

    // SQL delete
    static public function sqlDeleteById($table, $id)
    {
        if (DB::table($table)->delete($id))
            LR::sqlInvalidateRow($table, 'id', $id);
    }

    // SQL cache invalidation
    static public function sqlInvalidateRow($tableName, $field, $value, $updateTable = true)
    {
        if ($field == 'id')
            $id = $value;
        else
            $id = LR::sqlRowIdByValue($tableName, $field, $value);
        if ($id > 0)
            Cache::forget(MEMCACHED_NS_ROW . $tableName . '::' . 'id' . '::' . $id);
        if ($updateTable)
            LR::sqlInvalidateTable($tableName);
    }

    static public function sqlInvalidateTable($dbName, $time = '+12 hour')
    {
        Cache::put(MEMCACHED_NS_DB . $dbName, microtime(true), timeFromDate($time, 60));
    }

    // SEND HTML
    static public function buildSite($content = '', $title = '')
    {
        $finalHTML = View::make('pages/wrapper',
            array(
                'content' => $content,
                'currentPage' => CURRENT_PAGE,
                'title' => $title
            )
        );
        // $finalHTML = View::make('output/min_html', array('html' => $finalHTML));
        $response = Response::make($finalHTML);
        $response->header('Pragma', 'no-cache');
        $response->header('Expires', 0);
        $response->withCookie(Cookie::make(COOKIE_CSRF, sha1(md5(rand() . uniqid() . microtime())),
            COOKIE_CSRF_LIFE, '/', '.' . BASE_DOMAIN, false, false));

        return $response;
    }
}