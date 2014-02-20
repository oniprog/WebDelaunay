// JavaScript版ドロネー分割．ロバストではない
var KLIB = KLIB || {};

KLIB.Math = function() {

}

KLIB.Math.prototype = {

	determinant2x2 : function( v ) {
		return v[0] * v[3] - v[1] * v[2];
	},
	determinant3x3 : function( v ) {
		return v[0] * KLIB.Math.prototype.determinant2x2([v[4], v[5], v[7], v[8]] ) + 
			v[1] * KLIB.Math.prototype.determinant2x2([v[5], v[3], v[8], v[6]] ) +
			v[2] * KLIB.Math.prototype.determinant2x2([v[3], v[4], v[6], v[7]] );
	},
	orient_2 : function(p1,p2,p3) {
		return KLIB.Math.prototype.determinant2x2( [p1[0]-p3[0], p1[1]-p3[1], p2[0]-p3[0], p2[1]-p3[1]]);
	},
	incircle : function(p1,p2,p3,p4) {
		return KLIB.Math.prototype.determinant3x3([ 
			p1[0]-p4[0], p1[1]-p4[1], (p1[0]-p4[0])*(p1[0]-p4[0])+(p1[1]-p4[1])*(p1[1]-p4[1]),
			p2[0]-p4[0], p2[1]-p4[1], (p2[0]-p4[0])*(p2[0]-p4[0])+(p2[1]-p4[1])*(p2[1]-p4[1]),
			p3[0]-p4[0], p3[1]-p4[1], (p3[0]-p4[0])*(p3[0]-p4[0])+(p3[1]-p4[1])*(p3[1]-p4[1])]);
	}
};

KLIB.DictTriangle = function() {

	this.mapTri = {};
}

KLIB.DictTriangle.prototype = {

	addTriangle : function(pois, v1, v2, v3) {
		this.mapTri[[v1,v2]] = v3;
		this.mapTri[[v2,v3]] = v1;
		this.mapTri[[v3,v1]] = v2;
		if ( v1 < 0 || v2 < 0 || v3 < 0 )
			return;
	},
	deleteTriangle : function(v1, v2, v3) {

		delete this.mapTri[[v1,v2]];
		delete this.mapTri[[v2,v3]];
		delete this.mapTri[[v3,v1]];
	},
	adjacent : function(v1,v2) {
		return this.mapTri[[v1,v2]];
	},
	getValidTriangle : function() {

		var listRet = [];
		for(edge in this.mapTri) {

			var v3 = +this.mapTri[edge];
			var vv = edge.split(",");
			var v1 = +vv[0];
			var v2 = +vv[1];
			if ( v1 < 0 || v2 < 0 || v3 < 0 )
				continue;
			if ( v1 > v2 && v1 > v3 ) {
				listRet.push(v1,v2,v3);
			}
		}
		return listRet;
	}
}

KLIB.Delaunay = function() {

}
KLIB.Delaunay.prototype = {

	// [x1, y1, x2, y2, ....,] の羅列で与えること
	apply : function( pois ) {

		var dictTri = new KLIB.DictTriangle();
		if ( pois.length < 2*3 )
			return [];

		var it;
		var index = [];
		var size = pois.length/2;
		for( it=0; it<size; ++it) {
			index[it] = it*2;
		}
		//this.shuffle(index);
	
		// 初期三角形の作成
		var maxval = 0;
		var findip = 0;
		for( it=2; it<size; ++it ) {
			var orient = KLIB.Math.prototype.orient_2(
					[pois[index[0]], pois[index[0]+1]], 
					[pois[index[1]], pois[index[1]+1]],
					[pois[index[it]+0], pois[index[it]+1]]
			);
			if ( Math.abs(orient) > Math.abs(maxval) ) {
				maxval = orient;
				findip = it;
			}
		}
		if ( maxval == 0) 
			return [];

		this.tribef = [];
		if ( maxval > 0) {
			dictTri.addTriangle(pois, index[0], index[1], index[findip]);
			dictTri.addTriangle(pois, -1, index[1], index[0] );
			dictTri.addTriangle(pois, -1, index[findip], index[1]);
			dictTri.addTriangle(pois, -1, index[0], index[findip]);
			this.tribef = [index[0], index[1], index[findip]];
		}
		else {
			dictTri.addTriangle(pois, index[1], index[0], index[findip]);
			dictTri.addTriangle(pois, -1, index[1], index[findip]);
			dictTri.addTriangle(pois, -1, index[0], index[1]);
			dictTri.addTriangle(pois, -1, index[findip], index[0] );
			this.tribef = [index[1], index[0], index[findip]];
		}

		var pt1, pt2, pt3, ip4;
		var ip;
		for( ip=2; ip<size; ++ip ) {

			if (ip==findip)
				continue;

			var ind = index[ip];
			var poiInsert = [ pois[ind], pois[ind+1]];

			var tricur = this.tribef;
			while(true) {

				if ( tricur[0] < 0 || tricur[1] < 0 || tricur[2] < 0 )
					break;

				pt1 = [pois[tricur[0]], pois[tricur[0]+1]];
				pt2 = [pois[tricur[1]], pois[tricur[1]+1]];
				pt3 = [pois[tricur[2]], pois[tricur[2]+1]];

				var orient1 = KLIB.Math.prototype.orient_2( pt1, pt2, poiInsert );
				if ( orient1 < 0 ) {

					ip4 = dictTri.adjacent( tricur[1], tricur[0] );	
					tricur = [ tricur[1], tricur[0], ip4 ];
					continue;
				}
				var orient2 = KLIB.Math.prototype.orient_2( pt2, pt3, poiInsert );
				if ( orient2 < 0 ) {

					ip4 = dictTri.adjacent( tricur[2], tricur[1] );	
					tricur = [ tricur[2], tricur[1], ip4 ];
					continue;
				}
				var orient3 = KLIB.Math.prototype.orient_2( pt3, pt1, poiInsert );
				if ( orient3 < 0 ) {

					ip4 = dictTri.adjacent( tricur[0], tricur[2] );	
					tricur = [ tricur[0], tricur[2], ip4 ];
					continue;
				}
				break;
			}

			dictTri.deleteTriangle( tricur[0], tricur[1], tricur[2] );

			this.digCavity( dictTri, pois, ind, tricur[0], tricur[1] );
			this.digCavity( dictTri, pois, ind, tricur[1], tricur[2] );
			this.digCavity( dictTri, pois, ind, tricur[2], tricur[0] );
		}

		return dictTri.getValidTriangle();	
	},
	digCavity : function( dictTri, pois, u, v, w ) {

		var x = dictTri.adjacent( w, v );
		if( x === undefined )
			return;

		var pt1 = u < 0 ? [0,0] : [pois[u], pois[u+1]];
		var pt2 = v < 0 ? [0,0] : [pois[v], pois[v+1]];
		var pt3 = w < 0 ? [0,0] : [pois[w], pois[w+1]];
		var pt4 = x < 0 ? [0,0] : [pois[x], pois[x+1]];

		var bInCircle = false;
		if ( v < 0 ) {
			bInCircle = KLIB.Math.prototype.orient_2( pt3, pt4, pt1 ) < 0;
		}
		else if ( w < 0 ) {
			bInCircle = KLIB.Math.prototype.orient_2( pt4, pt2, pt1 ) < 0;
		}
		else if ( x < 0 ) {
			bInCircle = KLIB.Math.prototype.orient_2( pt2, pt3, pt1 ) < 0;
		}
		else {
			bInCircle = KLIB.Math.prototype.incircle( pt1, pt2, pt3, pt4) > 0;
		}

		if ( bInCircle ) {

			dictTri.deleteTriangle( w, v, x );
			this.digCavity( dictTri, pois, u, v, x ); 
			this.digCavity( dictTri, pois, u, x, w ); 
		}
		else {

			dictTri.addTriangle( pois, u, v, w );
			if (u >= 0 && v>=0 && w >=0 )
				this.tribef = [u,v,w];
		}
	},
	shuffle : function(list) {
		var i = list.length;

		while (--i > 0) {
			var j = Math.floor(Math.random() * (i + 1));
			if (i != j) {
				var k = list[i];
				list[i] = list[j];
				list[j] = k;
			}
	  	}

	  	return list;
	},
	test : function(canvas) {

		this.pois = [];
		this.canvas = canvas;
		var that = this;
		canvas.addEventListener('mousedown', function(ev) { that.test_onMouseDown.call(that,ev);}, false );
		this.test_draw();
	},
	test_onMouseDown : function(ev) {
		
		if ( ev.x === undefined ) ev.x = ev.clientX;
		if ( ev.y === undefined ) ev.y = ev.clientY;
		
		ev.preventDefault();
		if (ev.button == 0 ) { 
			this.pois.push( ev.x, ev.y );
			this.test_draw();
		}
		else if ( ev.button == 1 ) {
		}
		else if ( ev.button == 2 ) {

			this.pois.pop();
			this.pois.pop();
			this.test_draw();
		}
	},
	test_draw : function() {

		canvas = this.canvas;
		var pois = this.pois;
		var tris = this.apply(pois);
		var ctx = canvas.getContext('2d');
		ctx.fillStyle = "black";
		ctx.fillRect(0,0,1000,1000);

		ctx.strokeStyle= "white";
		var it;
		for( it=0; it<pois.length; it+=2 ) {

			ctx.beginPath();
			ctx.arc( pois[it+0], pois[it+1], 5, 0, Math.PI*2, false );
			ctx.stroke();
		}
		ctx.fillStyle= "white";
		ctx.strokeStyle= "white";
		for( it=0; it<tris.length; it+=3 ) {
			ctx.beginPath();
			var i1 = tris[it+0];
			var i2 = tris[it+1];
			var i3 = tris[it+2];
			ctx.moveTo( pois[i1+0], pois[i1+1] );
			ctx.lineTo( pois[i2+0], pois[i2+1] );
			ctx.lineTo( pois[i3+0], pois[i3+1] );
			ctx.lineTo( pois[i1+0], pois[i1+1] );
			ctx.closePath();
			ctx.stroke();
		}
	}
};


