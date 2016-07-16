<?php

$code = <<<'EOC'
<?php
$var = 42;
EOC;

var_dump(ast\parse_code($code, $version=30));
