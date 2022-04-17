export class SkuSelector {
  _splitter = "_";
  _cacheResult = new Map();
  _cacheInfo = new Map();
  /**
   *
   * @param {Array} props 属性数组
   * @param {Array} skus sku 数组
   */
  constructor(props, skus) {
    this.props = props;
    this.skus = skus;
    this.allAttrs = props.reduce((array, prop) => {
      prop.attrs.forEach((attr) => {
        const simpleAttr = { propId: prop.id, attrId: attr.id };
        simpleAttr._key = this.fmtUniqueAttrKey(simpleAttr);
        array.push(simpleAttr);
      });
      return array;
    }, []);
  }

  /**
   * 计算 skus 选择结果
   */
  select(selectedAttrs = []) {
    const cacheKey = this.getCacheKey(selectedAttrs);
    if (this._cacheResult.has(cacheKey)) {
      return this._cacheResult.get(cacheKey);
    }
    const { props } = this;
    const info = this.getInfoAfterSelected(selectedAttrs);

    // 获取当前可行 sku 的所有属性 key
    const activeAttrKeys = this.reduceAttrKeys(info.activeSkus);

    // 将所有的属性组合变成另外一种，计算是否有可行的 sku 组合
    selectedAttrs.forEach((selectedAttr) => {
      const selectedAttrKey = this.fmtUniqueAttrKey(selectedAttr);
      const prop = props.find((item) => item.id === selectedAttr.propId);
      const { attrs } = prop;
      attrs.forEach((attr) => {
        const simpleAttr = { propId: prop.id, attrId: attr.id };
        const currentAttrKey = this.fmtUniqueAttrKey(simpleAttr);
        if (currentAttrKey !== selectedAttrKey) {
          // 只计算该 prop 下，除已选择的attr以外的可能性

          // 把当前 prop 替换成另外一种 attr，然后重新获取可行 sku 信息
          const fakeSelected = [...selectedAttrs];
          fakeSelected.splice(
            selectedAttrs.indexOf(selectedAttr),
            1,
            simpleAttr
          );
          const { activeSkus } = this.getInfoAfterSelected(fakeSelected);

          // 如果组合可行，则记录该 attr 为可点击
          if (activeSkus.length) activeAttrKeys.add(currentAttrKey);
        }
      });
    });

    const disabledAttrs = this.allAttrs.filter(
      (attr) => !activeAttrKeys.has(attr._key)
    );
    const result = {
      ...info,
      disabledAttrs,
    };
    this._cacheResult.set(cacheKey, result);

    return result;
  }

  /**
   * 根据当前已选择的项目，获取目前的价格范围、总量、可继续选择的 sku 等
   */
  getInfoAfterSelected(selectedAttrs) {
    const cacheKey = this.getCacheKey(selectedAttrs);
    if (this._cacheInfo.has(cacheKey)) {
      return this._cacheInfo.get(cacheKey);
    }
    const { skus } = this;
    const activeSkus = (
      selectedAttrs.length
        ? // 包含所有选中条件的 sku
          skus.filter((sku) =>
            selectedAttrs.every(
              (select) =>
                sku.attrs.findIndex((attr) => this.isSameAttr(attr, select)) >=
                0
            )
          )
        : // 如果没有选中条件则返回全部 sku
          skus
    ).filter((sku) => sku.count > 0); // 过滤掉没有数据的，则是所有包含当前选中项的 sku

    // 获取最高和最低价格
    const prices = activeSkus.map((item) => item.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    // 统计所有数量
    const count = activeSkus.reduce((sum, sku) => sum + sku.count, 0);

    const info = { maxPrice, minPrice, count, activeSkus };
    this._cacheInfo.set(cacheKey, info);

    return info;
  }

  /**
   * 获取 sku 数组中包含的所有属性的 key
   * @returns {Set<string>}
   */
  reduceAttrKeys(skus) {
    return skus.reduce((set, sku) => {
      sku.attrs.forEach((attr) => set.add(this.fmtUniqueAttrKey(attr)));
      return set;
    }, new Set());
  }

  getCacheKey(selectedAttrs) {
    const arr = selectedAttrs.map((item) => this.fmtUniqueAttrKey(item));
    arr.sort();
    return arr.join(this._splitter.repeat(2));
  }

  isSameAttr(attr1, attr2) {
    return attr1?.propId === attr2?.propId && attr1?.attrId === attr2?.attrId;
  }

  /**
   * 获取 属性值的唯一标识 如 1_2
   * @returns
   */
  fmtUniqueAttrKey(attr) {
    return `${attr?.propId}${this._splitter}${attr?.attrId}` || "";
  }
}

// const props = [
//   {
//     id: 0,
//     label: "型号",
//     attrs: [
//       {
//         id: 0,
//         label: "戒指",
//       },
//       {
//         id: 1,
//         label: "低语",
//       },
//       {
//         id: 2,
//         label: "银蝶",
//       },
//     ],
//   },
//   {
//     id: 1,
//     label: "尺寸",
//     attrs: [
//       {
//         id: 0,
//         label: "A4",
//       },
//       {
//         id: 1,
//         label: "A3",
//       },
//     ],
//   },
//   {
//     id: 2,
//     label: "颜色",
//     attrs: [
//       {
//         id: 0,
//         label: "蓝色",
//       },
//       {
//         id: 1,
//         label: "黄色",
//       },
//     ],
//   },
// ];

// const skus = [
//   {
//     id: "61d6e6a48b8bef59306f5e00",
//     price: 100,
//     count: 0,
//     attrs: [
//       {
//         propId: 0,
//         attrId: 0,
//       },
//       {
//         propId: 1,
//         attrId: 0,
//       },
//       {
//         propId: 2,
//         attrId: 0,
//       },
//     ],
//   },
//   {
//     id: "61d6e6a48b8bef59306f5e01",
//     price: 200,
//     count: 0,
//     attrs: [
//       {
//         propId: 0,
//         attrId: 0,
//       },
//       {
//         propId: 1,
//         attrId: 0,
//       },
//       {
//         propId: 2,
//         attrId: 1,
//       },
//     ],
//   },
//   {
//     id: "61d6e6a48b8bef59306f5e02",
//     price: 200,
//     count: 0,
//     attrs: [
//       {
//         propId: 0,
//         attrId: 0,
//       },
//       {
//         propId: 1,
//         attrId: 1,
//       },
//       {
//         propId: 2,
//         attrId: 0,
//       },
//     ],
//   },
//   {
//     id: "61d6e6a48b8bef59306f5e03",
//     price: 200,
//     count: 0,
//     attrs: [
//       {
//         propId: 0,
//         attrId: 0,
//       },
//       {
//         propId: 1,
//         attrId: 1,
//       },
//       {
//         propId: 2,
//         attrId: 1,
//       },
//     ],
//   },
//   {
//     id: "61d6e6a48b8bef59306f5e04",
//     price: 150,
//     count: 0,
//     attrs: [
//       {
//         propId: 0,
//         attrId: 1,
//       },
//       {
//         propId: 1,
//         attrId: 0,
//       },
//       {
//         propId: 2,
//         attrId: 0,
//       },
//     ],
//   },
//   {
//     id: "61d6e6a48b8bef59306f5e05",
//     price: 150,
//     count: 0,
//     attrs: [
//       {
//         propId: 0,
//         attrId: 1,
//       },
//       {
//         propId: 1,
//         attrId: 0,
//       },
//       {
//         propId: 2,
//         attrId: 1,
//       },
//     ],
//   },
//   {
//     id: "61d6e6a48b8bef59306f5e06",
//     price: 600,
//     count: 20,
//     attrs: [
//       {
//         propId: 0,
//         attrId: 1,
//       },
//       {
//         propId: 1,
//         attrId: 1,
//       },
//       {
//         propId: 2,
//         attrId: 0,
//       },
//     ],
//   },
//   {
//     id: "61d6e6a48b8bef59306f5e07",
//     price: 600,
//     count: 0,
//     attrs: [
//       {
//         propId: 0,
//         attrId: 1,
//       },
//       {
//         propId: 1,
//         attrId: 1,
//       },
//       {
//         propId: 2,
//         attrId: 1,
//       },
//     ],
//   },
//   {
//     id: "61d6e6a48b8bef59306f5e08",
//     price: 400,
//     count: 65,
//     attrs: [
//       {
//         propId: 0,
//         attrId: 2,
//       },
//       {
//         propId: 1,
//         attrId: 0,
//       },
//       {
//         propId: 2,
//         attrId: 0,
//       },
//     ],
//   },
//   {
//     id: "61d6e6a48b8bef59306f5e09",
//     price: 400,
//     count: 50,
//     attrs: [
//       {
//         propId: 0,
//         attrId: 2,
//       },
//       {
//         propId: 1,
//         attrId: 0,
//       },
//       {
//         propId: 2,
//         attrId: 1,
//       },
//     ],
//   },
//   {
//     id: "61d6e6a48b8bef59306f5e10",
//     price: 70,
//     count: 0,
//     attrs: [
//       {
//         propId: 0,
//         attrId: 2,
//       },
//       {
//         propId: 1,
//         attrId: 1,
//       },
//       {
//         propId: 2,
//         attrId: 0,
//       },
//     ],
//   },
//   {
//     id: "61d6e6a48b8bef59306f5e11",
//     price: 400,
//     count: 65,
//     attrs: [
//       {
//         propId: 0,
//         attrId: 2,
//       },
//       {
//         propId: 1,
//         attrId: 1,
//       },
//       {
//         propId: 2,
//         attrId: 1,
//       },
//     ],
//   },
// ];

// const skuSelector = new SkuSelector(props, skus);
// const result = skuSelector.select([{ propId: 0, attrId: 1 }]);
