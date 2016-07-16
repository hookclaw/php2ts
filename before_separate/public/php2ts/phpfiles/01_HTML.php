<html>
<body>
<h1><?= "Hello" ?></h1>
<?php if(true): ?>
	Good bye
<?php else: ?>
	Good night
<?php endif; ?>
</body>
</html>


Not work.
<? echo 'このコードは短縮型のタグに囲まれていますが、'.
        'short_open_tag が有効な場合ににしか動作しません'; ?>


この構文は、PHP 7.0.0 で削除されました。
<script language="php">
    echo '(FrontPageのような) いくつかのエディタは、このタグの中の処理命令を好みません';
</script>


この構文は、PHP 7.0.0 で削除されました。
<% echo 'オプションでASP形式のタグを使用可能です'; %>
<%= $variable; %> これは、<% echo $variable; %> のショートカットです。
