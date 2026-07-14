// views/View.js
export default class View {
  _data;

  /**
   * Render the received HTML markup to the DOM
   * @param {Object | Object[]} data The data to be rendered (e.g. state content)
   */
  render(data) {
    this._data = data;
    const markup = this._generateMarkup();
    this._clear();
    this._parentElement.insertAdjacentHTML("afterbegin", markup);
  }

  _clear() {
    this._parentElement.innerHTML = "";
  }
}
