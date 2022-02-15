import styled from 'styled-components';
import { T } from '../features/i18n/components.jsx';

const HomeStyle = styled.div`
  .subtitle {
    color: #666;
    font-family: Lato, sans-serif;
    font-style: italic;
  }

  .title {
    font-family: 'Lora', serif;
    font-size: 30px;
    margin: 8px 0;
  }
`;

export const Home = () => {
  return (
    <HomeStyle>
      <h1 className="title">
        <T name="menus.home.title" />
      </h1>
      <h2 className="subtitle">
        <T name="menus.home.headline" />
      </h2>
    </HomeStyle>
  );
};
