
由于 script 的解析和执行会阻塞进程，HTML 的 parser就会被终止。
为什么会被终止？
这是由于浏览器的优化。由于 JS 的脚本会有潜在的可能执行 document.write() 等类似的文档流操作。
参见`normal.js`

那么有什么办法可以避免 HTML 的解析被阻塞呢？
一般常用的方式就是将 script 标签放在 body 的底部，也就是 </body> 闭合标签之前，这能确保在脚本执行前页面已经完成解析。


但是假如我有些脚本就是要尽快执行/放body前面行不行？

答案是可以的。使用 defer/async。

在 script 标签中设置 defer/async 就相当于告诉浏览器，我这部分代码里没有 document.write 等类似文档流操作，不会阻塞 HTML 的 parser.

看起来很美好，不过依然有各自的坑。
虽然在一些文档中定义的是 defer 会在 DOMContentLoad 之前执行，但是每家标准都似乎不太一样。比如 chrome 就是在 ContentLoad 之后。

假如我有更变态的性能追求，就是我不想等到 DOM 解析完全之后才执行脚本，而是加载完成之后就立即执行。那就得使用 async。

async 表示下载完了就尽快执行。

但 async 依然有问题。
假如有两段外部脚本（A和B）同时采用 async，但是B需要依赖A的一些函数才能执行。由于设置了 async，我们无法保证到底A和B谁先加载。因此对于相互依赖的JS脚本不用使用async。



### 终极加载解决方案
```js
var scripts = [
  '1.js',
  '2.js'
];
var src;
var script;
var pendingScripts = [];
var firstScript = document.scripts[0];


// 监视 IE 中的脚本加载
function stateChange() {
  // 尽可能多的按顺序执行脚本
  var pendingScript;
  while (pendingScripts[0] && pendingScripts[0].readyState == 'loaded') {
    pendingScript = pendingScripts.shift();
    // 避免该脚本的加载事件再次触发(比如修改了 src 属性)
    pendingScript.onreadystatechange = null;
    // 不能使用 appendChild，在低版本 IE 中如果元素没有闭合会有 bug
    firstScript.parentNode.insertBefore(pendingScript, firstScript);
  }
}

// 循环脚本地址
while (src = scripts.shift()) {
  if ('async' in firstScript) { // 现代浏览器
    script = document.createElement('script');
    script.async = false;
    script.src = src;
    document.head.appendChild(script);
  }
  else if (firstScript.readyState) { // IE<10
    // 创建一个脚本并添加进待执行队列中
    script = document.createElement('script');
    pendingScripts.push(script);
    // 监听状态改变
    script.onreadystatechange = stateChange;
    // 必须在添加 onreadystatechange 监听后设置 src
    // 否则会错过缓存脚本的加载事件
    script.src = src;
  }
  else { // 退化使用延迟加载
    document.write('<script src="' + src + '" defer></'+'script>');
  }
}
```


```js
var resourcelist = ['1.js', '2.js'];
!function(e,t,r){function n(){for(;d[0]&&"loaded"==d[0][f];)c=d.shift(),c[o]=!i.parentNode.insertBefore(c,i)}for(var s,a,c,d=[],i=e.scripts[0],o="onreadystatechange",f="readyState";s=r.shift();)a=e.createElement(t),"async"in i?(a.async=!1,e.head.appendChild(a)):i[f]?(d.push(a),a[o]=n):e.write("<"+t+' src="'+s+'" defer></'+t+">"),a.src=s}(document,"script",resourcelist)
```



- https://www.ibm.com/developerworks/cn/web/1308_caiys_jsload/index.html
- https://developer.mozilla.org/en-US/do cs/Web/Events/DOMContentLoaded
- http://w3c.github.io/html/semantics-scripting.html#element-attrdef-script-async (推荐)
- https://css-tricks.com/async-attribute-scripts-bottom/
- https://www.html5rocks.com/en/tutorials/speed/script-loading/ (推荐)