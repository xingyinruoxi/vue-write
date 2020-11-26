function defineReactive(obj, key, val) {
    observe(val);
    const dep = new Dep();
    Object.defineProperty(obj, key, {
        get() {
            console.log(`get:${key},val:${val}`);
            Dep.target && dep.addDep(Dep.target);
            return val;
        },
        set(newVal) {
            if (newVal == val) return;
            observe(newVal);
            val = newVal;
            // watchers.forEach(watch => {
            //     watch.update()
            // })
            dep.notity();
            console.log(`set:${key},val:${newVal}`);
        },
    });
}

function observe(obj) {
    if (typeof obj !== "object" || obj == null) return;
    Object.keys(obj).forEach((key) => {
        defineReactive(obj, key, obj[key]);
    });
}

function proxy(vm) {
    Object.keys(vm.$data).forEach((key) => {
        Object.defineProperty(vm, key, {
            get() {
                return vm.$data[key];
            },
            set(newVal) {
                vm.$data[key] = newVal;
            },
        });
    });
}

class Kvue {
    constructor(options) {
        this.$options = options;
        this.$data = options.data;
        // this.$el = options.el;
        this.walk(this.$data);
        proxy(this);
        // new Compiler(this.$el, this)
        if (options.el) {
            this.$mount(options.el);
        }
    }
    $mount(el) {
        this.$el = document.querySelector(el);

        $mount(el) {
            this.$el = document.querySelector(el);
            const updateComponent = () => {
                // const { render } = this.$options;
                // const el = render.call(this);
                // const parent = this.$el.parentElement;
                // parent.insertBefore(el, this.$el.nextSibling);
                // parent.removeChild(this.$el);
                // this.$el = el;

                // vnode实现
                const { render } = this.$options;
                const vnode = render.call(this, this.$createElement);
                this._update(vnode);
            };
            new Watcher(this, updateComponent);
        }
        $createElement(tag, props, children) {
            return { tag, props, children };
        }
        _update(vnode) {
            const preVnode = this._vnode;
            if (!preVnode) {
                // 初始化过程
                this._patch_(this.$el, vnode);
            } else {
                // 更新
                this._patch_(preVnode, vnode);
            }
        }
        _patch_(oldVnode, vnode) {
            // oldVnode是dom
            // console.log("---", oldVnode);
            if (oldVnode.nodeType) {
                // 初始化过程
                const parent = oldVnode.parentElement;
                const refElm = oldVnode.nextSibling;

                // props
                // children
                const el = this.createElm(vnode);
                console.log("vnode", vnode);
                console.log("el", el);
                parent.insertBefore(el, refElm);
                parent.removeChild(oldVnode);
                //保存vnode
                this._vnode = vnode;
            } else {
                // update todo
                console.log("update");
            }
        }
        createElm(vnode) {
            const el = document.createElement(vnode.tag);
            // props
            if (vnode.props) {
                for (const key in vnode.props) {
                    el.setAttribute(key, vnode.props[key]);
                }
            }

            console.log("vnode.children", vnode.children);
            // children
            if (vnode.children) {
                if (typeof vnode.children == "string") {
                    el.textContent = vnode.children;
                } else {
                    vnode.children.forEach((v) => {
                        const child = this.createElm(v);
                        console.log("child", child);
                        el.appendChild(child);
                    });
                }
            }

            // 保存vnode
            vnode.el = el;
            return el;
        }
        walk(obj) {
            if (Array.isArray(obj)) {
                console.log("===处理数组====");
            } else {
                observe(obj);
            }
        }
    }

    class Compiler {
        constructor(el, vm) {
            this.$el = document.querySelector(el);
            this.$vm = vm;
            if (this.$el) {
                this.compile(this.$el);
            }
        }
        compile(el) {
            const childNodes = el.childNodes;
            Array.from(childNodes).forEach((node) => {
                if (this.isElement(node)) {
                    const nodeAttrs = node.attributes;
                    Array.from(nodeAttrs).forEach((attr) => {
                        const attrName = attr.name;
                        const attrVal = attr.value;
                        if (this.isDirective(attrName)) {
                            const dir = attrName.substring(2);
                            this[dir] && this[dir](node, attrVal);
                        } else if (this.isEvent(attrName)) {
                            const eventType = attrName.substring(1);
                            this.eventHandle(node, eventType, attrVal);
                        }
                    });
                    // this.isDirective(nod)
                } else if (this.isIner(node)) {
                    this.conpileText(node, RegExp.$1);
                }
                if (node.childNodes) {
                    this.compile(node);
                }
            });
        }
        isElement(node) {
            return node.nodeType == 1;
        }
        text(node, exp) {
            // node.textContent = this.$vm[exp]
            // this.textUpdater(node, val);
            this.update(node, exp, "text");
        }
        update(node, exp, type) {
            const fn = this[type + "Updater"];
            fn && fn(node, this.$vm[exp]);
            new Watcher(this.$vm, exp, function(val) {
                fn && fn(node, val);
            });
        }
        model(node, exp) {
            this.update(node, exp, "model");
            node.addEventListener(
                "input",
                (e) => {
                    this.$vm[exp] = e.target.value;
                },
                false
            );
        }
        html(node, exp) {
            // node.innerHTML = this.$vm[exp]
            // this.htmlUpdater(node, val);
            this.update(node, exp, "html");
        }
        textUpdater(node, val) {
            node.textContent = val;
            // node.textContent = this.$vm[exp]
        }
        htmlUpdater(node, val) {
            node.innerHTML = val;
        }
        modelUpdater(node, val) {
            node.value = val;
        }
        isIner(node) {
            return node.nodeType == 3 && /\{\{(.*)\}\}/.test(node.textContent);
        }
        conpileText(node, exp) {
            // node.textContent = this.$vm[exp];
            this.update(node, exp, "text");
        }
        isDirective(attrName) {
            return attrName.startsWith("v-");
        }
        isEvent(attrName) {
            return attrName.startsWith("@");
        }
        eventHandle(node, eventType, attrVal) {
            const { methods } = this.$vm.$options;
            const fn = methods && methods[attrVal];
            node.addEventListener(eventType, fn.bind(this.$vm), false);
        }
    }

    // const watchers = [];
    class Dep {
        constructor() { <<
            <<
            <<
            <
            HEAD
            this.watchers = new Set()
        }
        addDep() {
            console.log('====')
            this.watchers.add(Dep.target) ===
                ===
                =
                this.watchers = new Set();
        }
        addDep() {
            this.watchers.add(Dep.target); >>>
            >>>
            >
            a7f1c63c2562d0206604471e6ce162084e445ab1
        }
        notity() {
            this.watchers.forEach((watch) => watch.update());
        }
    }
    class Watcher {
        constructor(vm, expOrfn) {
            this.$vm = vm; <<
            <<
            <<
            <
            HEAD
            this.getter = expOrfn;

            this.get();
            // Dep.target = this;
            // this.$vm[this.$key];
            // Dep.target = null;
        }

        get() {
            Dep.target = this;
            // this.$vm[this.$key];
            this.getter.call(this.$vm)
            Dep.target = null;
        }
        update() {
            // this.updateFn.call(this.$vm, this.$vm[this.$key])
            this.get() ===
                ===
                =
                this.updateFn = expOrfn;
            this.get();
        }
        get() {
            Dep.target = this;
            this.updateFn(this.$vm);
            Dep.target = null;
        }
        update() {
            // this.updateFn.call(this.$vm);
            this.get(); >>>
            >>>
            >
            a7f1c63c2562d0206604471e6ce162084e445ab1
        }
    }