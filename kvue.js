let watchers = [];

function defineReactive(obj, key, val) {
    observe(val);
    Object.defineProperty(obj, key, {
        get() {
            console.log(`get:${key},val:${val}`)
            return val;
        },
        set(newVal) {

            if (newVal == val) return;
            observe(newVal);
            val = newVal;
            watchers.forEach(watch => {
                watch.update()
            })
            console.log(`set:${key},val:${newVal}`)
        }
    });
}

function observe(obj) {
    if (typeof obj !== 'object' || obj == null) return;
    Object.keys(obj).forEach(key => {
        defineReactive(obj, key, obj[key]);
    })
}

function proxy(vm) {
    Object.keys(vm.$data).forEach(key => {
        Object.defineProperty(vm, key, {
            get() {
                return vm.$data[key]
            },
            set(newVal) {
                vm.$data[key] = newVal;
            }
        })
    })
}


class Kvue {
    constructor(options) {
        this.$options = options;
        this.$data = options.data;
        this.$el = options.el;
        this.walk(this.$data);
        proxy(this);
        new Compiler(this.$el, this)
    }

    walk(obj) {
        if (Array.isArray(obj)) {
            console.log('===处理数组====')
        } else {
            observe(obj)
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
        Array.from(childNodes).forEach(node => {
            if (this.isElement(node)) {
                const nodeAttrs = node.attributes;
                Array.from(nodeAttrs).forEach(attr => {
                    const attrName = attr.name;
                    const attrVal = attr.value;
                    if (this.isDirective(attrName)) {
                        const dir = attrName.substring(2);
                        this[dir] && this[dir](node, attrVal)
                    } else if (this.isEvent(attrName)) {
                        const eventType = attrName.substring(1);
                        this.eventHandle(node, eventType, attrVal);
                    }

                });
                // this.isDirective(nod)
            } else if (this.isIner(node)) {
                this.conpileText(node, RegExp.$1)
            }
            if (node.childNodes) {
                this.compile(node);
            }
        })
    }
    isElement(node) {
        return node.nodeType == 1
    }
    text(node, exp) {
        // node.textContent = this.$vm[exp]
        // this.textUpdater(node, val);
        this.update(node, exp, 'text');
    }
    update(node, exp, type) {

        const fn = this[type + 'Updater'];
        fn && fn(node, this.$vm[exp]);
        new Watcher(this.$vm, exp, function(val) {
            fn && fn(node, val);
        })

    }
    html(node, exp) {
        // node.innerHTML = this.$vm[exp]
        // this.htmlUpdater(node, val);
        this.update(node, exp, 'html');
    }
    textUpdater(node, val) {
        node.textContent = val;
        // node.textContent = this.$vm[exp]
    }
    htmlUpdater(node, val) {
        node.innerHTML = val;
    }
    isIner(node) {
        return node.nodeType == 3 && /\{\{(.*)\}\}/.test(node.textContent)
    }
    conpileText(node, exp) {
        // node.textContent = this.$vm[exp];
        this.update(node, exp, 'text');
    }
    isDirective(attrName) {
        return attrName.startsWith('v-')
    }
    isEvent(attrName) {
        return attrName.startsWith('@')
    }
    eventHandle(node, eventType, attrVal) {
        const { methods } = this.$vm.$options;
        const fn = methods && methods[attrVal];
        node.addEventListener(eventType, fn.bind(this.$vm), false);
    }
}



class Watcher {
    constructor(vm, key, fn) {
        this.$vm = vm;
        this.$key = key;
        this.updateFn = fn;
        watchers.push(this);
    }

    update() {
        this.updateFn.call(this.$vm, this.$vm[this.$key])
    }

}