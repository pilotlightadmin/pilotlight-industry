import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import FlameIcon from '../components/Icons';

const Container = styled.div`
  min-height: 100vh;
  background-color: #0a0a0a;
  color: #f5f0eb;
  font-family: 'DM Sans', sans-serif;
  position: relative;
  overflow-x: hidden;
  animation: fadeInPage 0.8s ease-in-out;

  @keyframes fadeInPage {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 3rem;
  border-bottom: 1px solid rgba(212, 165, 116, 0.1);
  position: relative;
  z-index: 10;

  @media (max-width: 768px) {
    padding: 1.5rem 1.5rem;
    border-bottom: 1px solid rgba(212, 165, 116, 0.05);
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: slideInDown 0.6s ease-out;

  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const FlameIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const HeaderTitle = styled.h1`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 0.95rem;
  font-weight: 300;
  letter-spacing: 0.15em;
  margin: 0;
  text-transform: uppercase;
  color: #f5f0eb;

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

const LogoutLink = styled.button`
  background: none;
  border: none;
  color: rgba(245, 240, 235, 0.4);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 300;
  letter-spacing: 0.08em;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.3s ease;
  padding: 0.5rem 0;
  text-decoration: none;

  &:hover {
    color: rgba(245, 240, 235, 0.7);
  }

  @media (max-width: 768px) {
    font-size: 0.7rem;
  }
`;

const MainContent = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  max-width: 900px;
  margin: 0 auto;
  min-height: calc(100vh - 140px);
  text-align: center;

  @media (max-width: 768px) {
    padding: 3rem 1.5rem;
    min-height: auto;
  }
`;

const WelcomeText = styled.h2`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 2.5rem;
  font-weight: 300;
  margin: 0 0 2rem 0;
  color: #f5f0eb;
  line-height: 1.2;
  animation: fadeInUp 0.8s ease-out 0.2s both;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const InstructionsText = styled.p`
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 300;
  color: rgba(245, 240, 235, 0.5);
  margin: 0 0 3rem 0;
  line-height: 1.7;
  max-width: 600px;
  animation: fadeInUp 0.8s ease-out 0.4s both;

  @media (max-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 2.5rem;
  }

  @media (max-width: 480px) {
    font-size: 0.85rem;
    line-height: 1.6;
    margin-bottom: 2rem;
  }
`;

const NavCardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  width: 100%;
  max-width: 600px;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const NavCard = styled.button`
  padding: 2.5rem 2rem;
  border: 1px solid rgba(212, 165, 116, 0.2);
  background-color: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.4s ease;
  text-align: center;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.8s ease-out 0.6s both;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at 30% 30%,
      rgba(212, 165, 116, 0.1),
      transparent 50%
    );
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  &:hover {
    border-color: rgba(212, 165, 116, 0.5);
    box-shadow: 0 0 30px rgba(212, 165, 116, 0.15),
                inset 0 0 30px rgba(212, 165, 116, 0.05);

    &::before {
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
`;

const CardTitle = styled.h3`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.5rem;
  font-weight: 300;
  margin: 0 0 0.75rem 0;
  color: #f5f0eb;
  letter-spacing: 0.08em;

  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`;

const CardSubtitle = styled.p`
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 300;
  color: rgba(245, 240, 235, 0.5);
  margin: 0;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const Footer = styled.footer`
  text-align: center;
  padding: 2rem;
  border-top: 1px solid rgba(212, 165, 116, 0.1);
  color: rgba(245, 240, 235, 0.3);
  font-size: 0.75rem;
  font-weight: 300;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  animation: fadeInUp 0.8s ease-out 0.8s both;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    font-size: 0.7rem;
  }
`;

const ViewingRoom = ({ currentUser, onNavigate, onLogout }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSeasonClick = () => {
    onNavigate('season');
  };

  const handleAllPilotsClick = () => {
    onNavigate('all-pilots');
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <FlameIconWrapper>
            <FlameIcon />
          </FlameIconWrapper>
          <HeaderTitle>The Viewing Room</HeaderTitle>
        </HeaderLeft>
        <LogoutLink onClick={handleLogout}>Logout</LogoutLink>
      </Header>

      <MainContent>
        <WelcomeText>Welcome to the Viewing Room</WelcomeText>

        <InstructionsText>
          Watch. Rate. Comment. Your anonymous feedback helps discover the next generation of television. Browse the current season's top-rated pilots or explore the full collection.
        </InstructionsText>

        <NavCardsContainer>
          <NavCard onClick={handleSeasonClick}>
            <CardTitle>The Season</CardTitle>
            <CardSubtitle>Top-rated pilots, curated for your review</CardSubtitle>
          </NavCard>

          <NavCard onClick={handleAllPilotsClick}>
            <CardTitle>All Pilots</CardTitle>
            <CardSubtitle>Explore the full collection</CardSubtitle>
          </NavCard>
        </NavCardsContainer>
      </MainContent>

      <Footer>Pilot Light</Footer>
    </Container>
  );
};

export default ViewingRoom;
