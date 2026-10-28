// Kör även utan webbläsare: node tests/test_restaurants.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({window:{claude:true},document:{addEventListener(){}},console,URL,URLSearchParams,AbortController,setTimeout,clearTimeout});
for (const file of ['mat.js','produkter.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
context.rows=JSON.parse(fs.readFileSync(path.join(root,'restauranger.json'),'utf8')).restaurants;
const result=vm.runInContext(`(() => {
  const foods=addRestaurants(rows);
  const failures=foods.flatMap(f=>{
    chooseProduct(0,f);
    const i=parseFood(f.n[0]).items[0];
    return i?.known && i.food.code===f.code && i.kcal===Math.round(f.kcal) ? [] : [f.label];
  });
  productChoices.clear();
  const menus=['bigmacmeny','bigmacmenyn','mcdonalds big mac menu','big mac meny'];
  return {failures,menus:menus.map(s=>parseFood(s).items[0]),
    big:parseFood('big mac').kcal, double:parseFood('2 big mac').kcal,
    invalid:parseFood('100 g big mac').unknown.length};
})()`,context);
assert.equal(result.failures.length,0,JSON.stringify(result.failures));
for (const item of result.menus) { assert.equal(item.known,false); assert.match(item.note,/inte en hel meny/); }
assert.equal(result.big,548); assert.equal(result.double,1096); assert.equal(result.invalid,1);
console.log('180 restaurangprodukter, portionsskalning, viktgräns och menyregressioner godkända.');
