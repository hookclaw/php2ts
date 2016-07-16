<?php
namespace FileAnalyzer;

class FileAnalyzer extends FileAnalyzerAbstract {
	public function judge(){
		return true;
	}
}
abstract class FileAnalyzerAbstract {
	public $file;
	public $bin;
	public $name;
	public $size;
	public $realsize;
	public $mimetype;
	public $type;
	public $error;

	public $pos = 0;
	public $status = "";

	public function __construct() {
		$this->type = "unknown";
	}
	public function set(&$file,&$bin) {
		$this->file = $file;
		$this->bin = $bin;
		$this->name = $file['name'];
		$this->size = $file['size'];
		$this->realsize = strlen($bin);
		$this->mimetype = $file['type'];
		$this->error = $file['error'];
	}
	public function createInfo(){
		$info = new Info(static::createSubTypeList());
		$info->push('File Name',$this->name);
		$info->push('MIME Type',$this->mimetype);
		$info->push('File Size',$this->size);
		if($this->error != 0){
			$this->status = "file upload error occured.";
			return $info;
		}
		$str = $this->getTop16();
		$info->push('Top 16bytes',$str,false,'text/hex');
		$info->push('File Type',$this->type);
		return $info;
	}
	public function getTop16(){
		$size = strlen($this->bin);
		$l16 = ($size<16)?$size:16;
		return substr($this->bin,0,$l16);
	}
	public function judge(){
		return false;
	}
	public function urls(){
		return array();
	}
	static protected function createSubTypeList(){
		return [];
	}
	protected function pop($len){
		$p = $this->pos;
		$this->pos += $len;
		return substr($this->bin,$p,$len);
	}
	public function getStringZero(&$strlen,$maxlen){
		$strlen = 0;
		$p = $this->pos;
		while(($this->size > $p) && ($maxlen > $strlen)){
			$strlen++;
			if(substr($this->bin,$p,1) == "\0")
				break;
			$p++;
		}
		if($strlen == 0)
			return '';
		return $this->getChar($strlen);
	}
	public function getChar($len,$pos=false){
		if($pos !== false)
			$this->pos = $pos;
		return $this->pop($len);
	}
// 	public function getI8Array($len,$pos=false){
// 		if($pos !== false)
// 			$this->pos = $pos;
// 		$s = $this->pop($len);
// 		$r = array();
// 		for($i=0;$i<$len;$i++){
// 			$r[] = ord(substr($s,$i,1));
// 		}
// 		return $r;
// 	}
// 	public function getI8($pos=false){
// 		if($pos !== false)
// 			$this->pos = $pos;
// 		//8 ビット
// 		return ord($this->pop(1));
// 	}

	/**
	 * signed char
	 */
	public function getS8($pos=false){
		if($pos !== false)
			$this->pos = $pos;
		return unpack('c',$this->pop(1))[1];
	}
	/**
	 * unsigned char
	 */
	public function getU8($pos=false){
		if($pos !== false)
			$this->pos = $pos;
		return ord($this->pop(1));
		//return unpack('C',$this->pop(1))[1];
	}
	/**
	 * signed short BigEndian
	 */
	public function getS16BE($pos=false){
		if($pos !== false)
			$this->pos = $pos;
		//一旦、マシンのバイトオーダーに変換。
		return unpack('s',pack('s',unpack('n',$this->pop(2))[1]))[1];
	}
	/**
	 * unsigned short BigEndian
	 */
	public function getU16BE($pos=false){
		if($pos !== false)
			$this->pos = $pos;
		return unpack('n',$this->pop(2))[1];
	}
	/**
	 * signed short LittleEndian
	 */
	public function getS16LE($pos=false){
		if($pos !== false)
			$this->pos = $pos;
		//一旦、マシンのバイトオーダーに変換。
		return unpack('s',pack('s',unpack('v',$this->pop(2))[1]))[1];
	}
	/**
	 * unsigned short LittleEndian
	 */
	public function getU16LE($pos=false){
		if($pos !== false)
			$this->pos = $pos;
		return unpack('v',$this->pop(2))[1];
	}
	/**
	 * signed long BigEndian
	 */
	public function getS32BE($pos=false){
		if($pos !== false)
			$this->pos = $pos;
		//一旦、マシンのバイトオーダーに変換。
		return unpack('l',pack('l',unpack('N',$this->pop(4))[1]))[1];
	}
	/**
	 * unsigned long BigEndian
	 */
	public function getU32BE($pos=false){
		if($pos !== false)
			$this->pos = $pos;
		//環境依存あり。signed longになる場合がある。
		return unpack('N',$this->pop(4))[1];
	}
	/**
	 * signed long LittleEndian
	 */
	public function getS32LE($pos=false){
		if($pos !== false)
			$this->pos = $pos;
		//一旦、マシンのバイトオーダーに変換。
		return unpack('l',pack('l',unpack('V',$this->pop(4))[1]))[1];
	}
	/**
	 * unsigned long LittleEndian
	 */
	public function getU32LE($pos=false){
		if($pos !== false)
			$this->pos = $pos;
		//環境依存あり。signed longになる場合がある。
		return unpack('V',$this->pop(4))[1];
	}
}

?>