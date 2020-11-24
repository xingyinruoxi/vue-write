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

const obj = { name: 'zhoulin' };
observe(obj);
obj.name = {
    sex: '男'
};
obj.name.sex = '女';