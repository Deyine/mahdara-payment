if defined?(AwesomePrint)
  require "awesome_print"
  AwesomePrint.defaults = {
    indent: 2,
    index: false,
    multiline: true,
    plain: false,
    sort_keys: true
  }
end
