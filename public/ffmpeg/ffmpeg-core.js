var createFFmpegCore = (() => {
  var _scriptDir = import.meta.url;
  if (typeof self !== 'undefined') self.location || (_scriptDir = self.location.href);
  else if (typeof location !== 'undefined') _scriptDir = location.href;
  if (_scriptDir.indexOf('blob:') !== 0) _scriptDir = _scriptDir.substring(0, _scriptDir.lastIndexOf('/') + 1);
  else _scriptDir = '';
  var _isFilePicker, _is and so on...