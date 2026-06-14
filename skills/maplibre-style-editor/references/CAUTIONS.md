# MapLibre Style 注意点

MapLibre Style Specificationに準拠したスタイルを記述する際に注意すべき点をまとめたリファレンスドキュメントです。

ベストプラクティスについては [BEST_PRACTICES.md](BEST_PRACTICES.md) を参照。

---

## 1. `layout` と `paint` の区別

プロパティは必ず正しいセクションに配置する。誤配置はエラーになる。

| セクション | 役割 | 代表的なプロパティ |
|-----------|------|-----------------|
| `layout` | 形状・配置（タイル処理） | `text-field`, `icon-image`, `line-cap`, `visibility` |
| `paint` | 見た目・色・透明度 | `fill-color`, `line-width`, `circle-opacity`, `text-color` |

```jsonc
// NG
"paint": {
  "text-field": ["get", "name"]  // layout プロパティを paint に置かない
}

// OK
"layout": {
  "text-field": ["get", "name"]
},
"paint": {
  "text-color": "#333333"
}
```

---

## 2. `source-layer` の使用制限

`source-layer` は `vector` ソースのみに指定する。GeoJSON ソースには不要（指定するとエラー）。

```jsonc
// NG: GeoJSON ソースに source-layer を指定
{
  "id": "my-layer",
  "type": "fill",
  "source": "my-geojson",
  "source-layer": "data"  // GeoJSON には不可
}

// OK: vector ソースのみ
{
  "id": "my-layer",
  "type": "fill",
  "source": "my-vector-source",
  "source-layer": "landuse"
}
```

---

## 3. `text-font` はスプライト・グリフの設定に依存する

`text-font` に指定するフォント名は、`glyphs` エンドポイントで配信されているフォントと一致させる。  
存在しないフォント名を指定するとフォールバックされるが、警告が発生する。

```jsonc
// 複数指定でフォールバック（推奨）
"text-font": ["Noto Sans Regular", "Arial Unicode MS Regular"]
```

---

## 4. `icon-image` はスプライト内の ID を正確に指定する

スプライトに存在しないアイコン ID を指定するとアイコンが表示されない（エラーにはならない）。  
`sprite` プロパティで指定した JSON の `id` と完全一致させる。

```jsonc
"layout": {
  "icon-image": "marker-15"  // sprite JSONのキーと一致させる
}
```

---

## 5. `sort-key` の挙動：レイヤー種別によって優先順位の意味が異なる

`line-sort-key`・`fill-sort-key`・`circle-sort-key`・`symbol-sort-key` はいずれもフィーチャーの描画順を制御するが、  
**ラインやポリゴンの場合とシンボル（ポイント）の場合で優先順位の方向が逆になる**点に注意が必要。

### ライン・ポリゴン・サークル：値が大きいフィーチャが上に描画される

```json
// line-sort-key: 値が大きいほど上に描画される（Z順）
{
  "id": "roads",
  "type": "line",
  "layout": {
    "line-sort-key": ["get", "rank"]
  }
}
```

`rank` が高いフィーチャほど他のフィーチャの上に重なって描画される。

### シンボル（symbol）：値が小さいフィーチャが配置の優先権を持つ

```json
// symbol-sort-key: 値が小さいほど先に配置が試みられ、衝突回避で残りやすい
{
  "id": "labels",
  "type": "symbol",
  "layout": {
    "symbol-sort-key": ["get", "priority"]
  }
}
```

シンボルは衝突回避（collision detection）のために配置順が重要で、  
**値が小さいフィーチャが先に配置を試みるため、衝突が発生した場合に表示が優先される。**  
値が大きいフィーチャは後から配置を試みるため、衝突相手がいれば非表示になる。

### まとめ

| レイヤー種別 | sort-key が大きい | sort-key が小さい |
|------------|-------------------|-------------------|
| `line` / `fill` / `circle` | 上に描画（優先表示） | 下に描画 |
| `symbol` | 後から配置（衝突時に非表示になりやすい） | 先に配置（衝突時に**表示が優先**） |
