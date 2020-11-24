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
        this.walk(this.$data);
        proxy(this);
    }

    walk(obj) {
        if (Array.isArray(obj)) {
            console.log('处理数组')
        } else {
            observe(obj)
        }
    }
}