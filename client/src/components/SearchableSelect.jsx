import Select from 'react-select';

const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  isClearable = true,
  isRequired = false,
  isDisabled = false,
  className = '',
}) => {
  // Custom styles to match existing design
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '48px',
      border: `1px solid ${state.isFocused ? '#167bff' : '#e2e8f0'}`,
      borderRadius: '0.5rem',
      boxShadow: 'none',
      backgroundColor: 'white',
      cursor: 'pointer',
      transition: 'border-color 0.2s',
      '&:hover': {
        borderColor: state.isFocused ? '#167bff' : '#cbd5e1',
      },
    }),
    input: (provided) => ({
      ...provided,
      color: '#1e293b',
      margin: '0',
      padding: '0',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '0.5rem',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      marginTop: '4px',
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '4px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#167bff'
        : state.isFocused
        ? '#f1f5f9'
        : 'white',
      color: state.isSelected ? 'white' : '#1e293b',
      cursor: 'pointer',
      borderRadius: '0.375rem',
      padding: '8px 12px',
      margin: '2px 0',
      '&:active': {
        backgroundColor: state.isSelected ? '#167bff' : '#e2e8f0',
      },
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: '#94a3b8',
      '&:hover': {
        color: '#1e293b',
      },
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: '#94a3b8',
      '&:hover': {
        color: '#1e293b',
      },
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      backgroundColor: '#e2e8f0',
    }),
  };

  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isClearable={isClearable}
      isDisabled={isDisabled}
      isSearchable={true}
      styles={customStyles}
      className={className}
      required={isRequired}
      noOptionsMessage={() => 'Aucune option trouvée'}
      loadingMessage={() => 'Chargement...'}
    />
  );
};

export default SearchableSelect;
