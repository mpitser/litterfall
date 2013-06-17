<?php
header("Content-type: application/vnd.ms-excel; name='excel'");
header("Content-Disposition: filename=export.csv");
// Fix for crappy IE bug in download.
header("Pragma: ");
header("Cache-Control: ");
 
$CSV = $_REQUEST['#plot-table'] ;
$replacements = array("@<table[^>]*>@i" => '' ,
'@</tabl[^>]*>@i' => '' , // remove </table>
'@<thea[^>]*>@i' => '' , // remove <thead>
'@<tbod[^>]*>@i' => '' , // remove <tbody>
'@</the[^>]*>@i' => '' , // remove </thead>
'@</tbo[^>]*>@i' => '' , // remove </trbody>
'@<tr[^>]*>@i' => '' , // remove <tr>
'@</tr[^>]*>@i' => '' , // remove </tr>
'@<th[^>]*>@i' => '' , // remove<th>
'@</th[^>]*>@i' => '' , // remove </th>
'@<td[^>]*>@i' => '' , // remove<td>
'@</td[^>]*>@i' => ',' , // The comma for separating
);

$CSV = preg_replace( array_keys( $replacements ), array_values( $replacements ), $CSV ) ;
?>
<html>
<head></head>
<body><?=$CSV?>
</body>
</html>
