<?php

/** interface
 */
interface itf {
	public function f1($p1,$p2);
	public function f2($p1,$p2);
}

/** abastract class
 */
abstract class acl {
	const A = "A";
	public $ppub1 = "a";
	private $ppri1;
	static $st = 1;

	/** method
	*/
	public function fpub($p1){
		return $p1;
	}
	protected function fpro($p1){
		return $p1;
	}
	private function fpri($p1){
		return $p1;
	}
	final static function fsta($p1){
		return $p1;
	}
	abstract function &fabs($p1) : array;
}

trait trt1 {
	public function fpub($p1){
		return $p1;
	}
}
trait trt2 {
	public function fpub($p1){
		return $p1;
	}
}

class cls extends acl implements itf {
	use trt1,trt2 {
		trt2::fpub insteadOf trt1;
		trt1::fpub as private fpub1;
	}
	public function __construct($p1){
		parent::__construct();
		self::x();
		static::x();
		$this->ppri1 = $p1;
	}
	public function f1($p1,$p2){
		return $p1 + $p2;
	}
	public function f2($p1,$p2){
		return $p1 - $p2;
	}
	function &fabs($p1) : array {
		return array();
	}
}

cls::A;
cls::fsta();
cls::$st;
